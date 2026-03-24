import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');

const BATTERY_LIFE_BY_DEVICE_KEY = {
  gw_mkgw1_bw_pro: 'Externally powered',
  gw_mk107_series: 'Externally powered',
  gw_mk107d_pro_35d: 'Externally powered',
  gw_mkgw2_lw: 'Externally powered',
  gw_lw003_b: 'Max 1 month (reported every 3 minutes)',
  gw_mkgw3: 'Externally powered; optional 540mAh backup battery',
  gw_mkgw4: 'Externally powered with 3000mAh backup battery',
  anchor_mkbal_c25_p: 'Externally powered',
  anchor_l01a: '8+ years',
  anchor_l03: '10+ years (Li-SOCI2) / 5 years (Alkaline)',
  anchor_l04: '5+ years',
  anchor_l05_usb_beacon: 'Infinite battery life',
  beacon_m1p_led_tag: '9 months (default settings)',
  beacon_m5_high_temp_tag: '3 years',
  beacon_m2_multi_variant_tag: '3 years with motion detection',
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
  const baseId = process.env.NOCODB_BASE_ID ?? fileValues.NOCODB_BASE_ID;

  if (!baseUrl || !token || !baseId) {
    throw new Error('Missing NocoDB config. Provide base URL, API token, and base ID in env or .env.');
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token,
    baseId,
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
  return Array.isArray(response) ? response : response.list ?? response.data ?? [];
}

async function patchRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'PATCH',
    body: JSON.stringify(records),
  });
}

function getRowString(row, key) {
  const value = row?.[key];
  return typeof value === 'string' ? value : '';
}

function getRowNumber(row, key) {
  const value = row?.[key];
  return typeof value === 'number' ? value : undefined;
}

async function main() {
  const { baseUrl, token, baseId } = await loadConfig();
  const tableIndex = await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token);
  const tables = new Map((tableIndex.list ?? []).map((table) => [table.title, table.id]));
  const specsRows = await fetchAll(baseUrl, token, tables.get('device_specs'));

  const patchPayload = specsRows
    .map((row) => {
      const deviceKey = getRowString(row, 'device_key');
      const nextValue = BATTERY_LIFE_BY_DEVICE_KEY[deviceKey];
      const currentValue = getRowString(row, 'battery_life_estimate').trim();

      if (!nextValue || currentValue === nextValue) {
        return null;
      }

      return {
        Id: getRowNumber(row, 'Id'),
        battery_life_estimate: nextValue,
      };
    })
    .filter(Boolean);

  if (!patchPayload.length) {
    console.log('device_specs: no battery life updates needed');
    return;
  }

  if (!APPLY) {
    console.log(`DRY RUN populate device_specs.battery_life_estimate for ${patchPayload.length} row(s)`);
    return;
  }

  await patchRecords(baseUrl, token, tables.get('device_specs'), patchPayload);
  console.log(`Populated device_specs.battery_life_estimate for ${patchPayload.length} row(s)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
