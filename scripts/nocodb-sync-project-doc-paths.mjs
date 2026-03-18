import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');
const BASE_ID = 'pys78cyayu9qnx1';

const DEVICE_DATASHEET_PATHS = {
  gw_mkgw1_bw_pro: '/docs/gateways/mkgw1-bw-pro/MKGW1-BW-Pro-Bluetooth-Gateway-Specification-V1.1.pdf',
  gw_mk107_series: '/docs/gateways/mk107-series/MK107-Series-Product-Brief_V1.2.pdf',
  gw_mk107d_pro_35d: '/docs/gateways/mk107d-pro-35d/MK107-Series-Product-Brief_V1.2.pdf',
  gw_mkgw2_lw: '/docs/gateways/mkgw2-lw/MKGW2-LW-LoRaWAN-Gateway-Brief.pdf',
  gw_lw003_b: '/docs/gateways/lw003-b/lw003-B-Bluetooth-Bridge-Brief_v1.1.pdf',
  gw_mkgw3: '/docs/gateways/mkgw3/MKGW3-Indoor-PoE-Gateway-Brief.pdf',
  gw_mkgw4: '/docs/gateways/mkgw4/MKGW4-Cellular-Gateway-Brief.pdf',
  anchor_l01a: '/docs/anchors/l01a/L01-Wayfinding-Anchor-Brief.pdf',
  anchor_l03: '/docs/anchors/l03/L03-Product-Brief_V2.0.pdf',
  anchor_l04: '/docs/anchors/l04/L04-brief_250207.pdf',
  anchor_l05_usb_beacon: '/docs/anchors/l05/L05-USB-Beacon-Brief.pdf',
  beacon_m1p_led_tag: '/docs/beacons/m1p/M1P-LED-Tag-Brief.pdf',
  beacon_m5_high_temp_tag: '/docs/beacons/m5/M5-High-Temp-Resistant-Tag-Brief_V1.2.pdf',
};

const DEVICE_MANUAL_PATHS = {
  gw_mkgw1_bw_pro: '/docs/gateways/mkgw1-bw-pro/MKGW1-BW-Pro-Bluetooth-Gateway-Specification-V1.1.pdf',
  gw_mk107_series: '/docs/gateways/mk107-series/MK107-Series-Product-Brief_V1.2.pdf',
  gw_mk107d_pro_35d: '/docs/gateways/mk107d-pro-35d/MK107-Series-Product-Brief_V1.2.pdf',
  gw_mkgw2_lw: '/docs/gateways/mkgw2-lw/MKGW2-LW-LoRaWAN-Gateway-Brief.pdf',
  gw_lw003_b: '/docs/gateways/lw003-b/lw003-B-Bluetooth-Bridge-Brief_v1.1.pdf',
  gw_mkgw3: '/docs/gateways/mkgw3/MKGW3-Indoor-PoE-Gateway-Brief.pdf',
  gw_mkgw4: '/docs/gateways/mkgw4/MKGW4-Cellular-Gateway-Brief.pdf',
  anchor_l01a: '/docs/anchors/l01a/L01-Wayfinding-Anchor-Brief.pdf',
  anchor_l03: '/docs/anchors/l03/L03-Product-Brief_V2.0.pdf',
  anchor_l04: '/docs/anchors/l04/L04-brief_250207.pdf',
  anchor_l05_usb_beacon: '/docs/anchors/l05/L05-USB-Beacon-Brief.pdf',
  beacon_m1p_led_tag: '/docs/beacons/m1p/M1P-LED-Tag-Brief.pdf',
  beacon_m5_high_temp_tag: '/docs/beacons/m5/M5-High-Temp-Resistant-Tag-Brief_V1.2.pdf',
};

function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    values[key] = value;
  }
  return values;
}

async function loadConfig() {
  const fileValues = await fs.readFile(ENV_PATH, 'utf8').then(parseEnv).catch(() => ({}));
  const baseUrl = process.env.NOCODB_BASE_URL ?? process.env.VITE_NOCODB_BASE_URL ?? fileValues.NOCODB_BASE_URL ?? fileValues.VITE_NOCODB_BASE_URL;
  const token = process.env.NOCODB_API_TOKEN ?? process.env.VITE_NOCODB_API_KEY ?? fileValues.NOCODB_API_TOKEN ?? fileValues.VITE_NOCODB_API_KEY;

  if (!baseUrl || !token) {
    throw new Error('Missing NocoDB config. Provide base URL and API token in env or .env.');
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token,
  };
}

async function apiFetch(url, token, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed ${response.status} ${response.statusText} for ${url}\n${body}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function fetchAll(baseUrl, token, tableId) {
  const url = new URL(`${baseUrl}/api/v2/tables/${tableId}/records`);
  url.searchParams.set('limit', '200');
  const response = await apiFetch(url, token);
  return response.list ?? [];
}

async function patchRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'PATCH',
    body: JSON.stringify(records),
  });
}

async function main() {
  const { baseUrl, token } = await loadConfig();
  const tablesResponse = await apiFetch(`${baseUrl}/api/v2/meta/bases/${BASE_ID}/tables`, token);
  const tables = new Map((tablesResponse.list ?? []).map((table) => [table.title, table.id]));

  const devicesTableId = tables.get('devices');
  const specsTableId = tables.get('device_specs');
  if (!devicesTableId || !specsTableId) {
    throw new Error('Required tables not found.');
  }

  const [devices, specs] = await Promise.all([
    fetchAll(baseUrl, token, devicesTableId),
    fetchAll(baseUrl, token, specsTableId),
  ]);

  const deviceUpdates = devices
    .filter((record) => DEVICE_DATASHEET_PATHS[record.device_key] && record.datasheet_path !== DEVICE_DATASHEET_PATHS[record.device_key])
    .map((record) => ({
      Id: record.Id,
      datasheet_path: DEVICE_DATASHEET_PATHS[record.device_key],
    }));

  const specUpdates = specs
    .filter((record) => DEVICE_MANUAL_PATHS[record.device_key] && record.manual_path !== DEVICE_MANUAL_PATHS[record.device_key])
    .map((record) => ({
      Id: record.Id,
      manual_path: DEVICE_MANUAL_PATHS[record.device_key],
    }));

  if (!APPLY) {
    console.log(`devices: would update ${deviceUpdates.length} record(s)`);
    console.log(`device_specs: would update ${specUpdates.length} record(s)`);
    console.log('Dry run complete. Re-run with --apply to sync project doc paths.');
    return;
  }

  if (deviceUpdates.length) {
    await patchRecords(baseUrl, token, devicesTableId, deviceUpdates);
    console.log(`devices: updated ${deviceUpdates.length} record(s)`);
  }

  if (specUpdates.length) {
    await patchRecords(baseUrl, token, specsTableId, specUpdates);
    console.log(`device_specs: updated ${specUpdates.length} record(s)`);
  }

  console.log('Project doc paths synced.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
