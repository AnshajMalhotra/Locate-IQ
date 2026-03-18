import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');
const BASE_ID = 'pys78cyayu9qnx1';

const URLS = {
  gw_mkgw1_bw_pro: 'https://www.mokosmart.com/de/mokosmart-mkgw1-gateway-iot-cloud-platform/',
  gw_mk107_series: 'https://www.mokosmart.com/de/moko-ble-to-wifi-gateway-data-relay-between-beacons-and-your-cloud-server-mk107/',
  gw_mk107d_pro_35d: 'https://www.mokosmart.com/de/moko-ble-to-wifi-gateway-data-relay-between-beacons-and-your-cloud-server-mk107/',
  gw_mkgw2_lw: 'https://www.mokosmart.com/lorawan-gateway-mkgw2-lw/',
  gw_lw003_b: 'https://www.mokosmart.com/lorawan-probe-lw003-b/',
  gw_mkgw3: 'https://www.mokosmart.com/de/mkgw3-indoor-poe-gateway/',
  gw_mkgw4: 'https://www.mokosmart.com/mkgw4-outdoor-cellular-gateway/',
  anchor_mkbal_c25_p: 'https://www.mokosmart.com/bluetooth-beacons/',
  anchor_l01a: 'https://www.mokosmart.com/l01-l01a-wayfinding-tag/',
  anchor_l03: 'https://www.mokosmart.com/l03-navigation-anchor/',
  anchor_l04: 'https://www.mokosmart.com/l04-navigation-anchor/',
  anchor_l05_usb_beacon: 'https://www.mokosmart.com/l05-usb-ble-beacon/',
  beacon_m1p_led_tag: 'https://www.mokosmart.com/m1p-led-tag/',
  beacon_m5_high_temp_tag: 'https://www.mokosmart.com/m5-high-temp-resistant-tag/',
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

async function updateRecord(baseUrl, token, tableId, recordId, payload) {
  await apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records/${recordId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

async function main() {
  const { baseUrl, token } = await loadConfig();
  const tablesResponse = await apiFetch(`${baseUrl}/api/v2/meta/bases/${BASE_ID}/tables`, token);
  const devicesTable = (tablesResponse.list ?? []).find((table) => table.title === 'devices');
  if (!devicesTable) {
    throw new Error('devices table not found');
  }

  const devices = await fetchAll(baseUrl, token, devicesTable.id);
  const patchPayload = devices
    .filter((record) => URLS[record.device_key] && record.vendor_product_url !== URLS[record.device_key])
    .map((record) => ({
      Id: record.Id,
      vendor_product_url: URLS[record.device_key],
    }));

  if (!APPLY) {
    console.log(`devices: would update ${patchPayload.length} record(s)`);
    console.log('Dry run complete. Re-run with --apply to write vendor URLs.');
    return;
  }

  if (!patchPayload.length) {
    console.log('devices: nothing to update');
    return;
  }

  for (const record of patchPayload) {
    await updateRecord(baseUrl, token, devicesTable.id, record.Id, {
      vendor_product_url: record.vendor_product_url,
    });
  }

  console.log(`devices: updated ${patchPayload.length} record(s)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
