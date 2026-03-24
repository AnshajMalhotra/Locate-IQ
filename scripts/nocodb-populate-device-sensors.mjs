import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');

const SENSOR_OVERRIDES = {
  gw_mkgw1_bw_pro: [],
  gw_mk107_series: [],
  gw_mk107d_pro_35d: [],
  gw_mkgw2_lw: [],
  gw_lw003_b: [],
  gw_mkgw3: [],
  gw_mkgw4: [],
  beacon_m1p_led_tag: ['3-axis accelerometer', 'temperature logger (optional)'],
  beacon_m5_high_temp_tag: ['accelerometer', 'temperature sensor', 'hall switch'],
  anchor_l01a: ['3-axis accelerometer', 'temperature sensor (optional)', 'humidity sensor (optional)', 'hall-effect sensor', 'barometric pressure sensor'],
  anchor_l03: ['accelerometer sensor', 'temperature sensor (optional)'],
  anchor_l04: ['accelerometer sensor (optional)', 'temperature sensor (optional)'],
  anchor_l05_usb_beacon: [],
  beacon_m2_multi_variant_tag: ['3-axis accelerometer', 'temperature sensor', 'humidity sensor', 'hall-effect sensor'],
};

const SENSOR_NORMALIZATION = {
  temperature: 'temperature sensor',
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

function splitMultilineField(value) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeSensorLabel(value) {
  const normalized = value.trim().toLowerCase();
  return SENSOR_NORMALIZATION[normalized] ?? value.trim();
}

async function main() {
  const { baseUrl, token, baseId } = await loadConfig();
  const tableIndex = await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token);
  const tables = new Map((tableIndex.list ?? []).map((table) => [table.title, table.id]));

  const specsRows = await fetchAll(baseUrl, token, tables.get('device_specs'));
  const variantRows = await fetchAll(baseUrl, token, tables.get('device_variants'));
  const sensorsByDeviceKey = variantRows.reduce((accumulator, row) => {
    const deviceKey = getRowString(row, 'device_key');
    if (!deviceKey) return accumulator;

    for (const sensor of splitMultilineField(getRowString(row, 'sensors'))) {
      accumulator[deviceKey] ??= new Set();
      accumulator[deviceKey].add(normalizeSensorLabel(sensor));
    }

    return accumulator;
  }, {});

  const patchPayload = specsRows
    .map((row) => {
      const deviceKey = getRowString(row, 'device_key');
      const overrideSensors = (SENSOR_OVERRIDES[deviceKey] ?? []).map(normalizeSensorLabel);
      const variantSensors = [...(sensorsByDeviceKey[deviceKey] ?? new Set())];
      const nextSensors = [...new Set([...overrideSensors, ...variantSensors])].sort((a, b) => a.localeCompare(b)).join(',');
      const currentSensors = getRowString(row, 'sensors').trim();

      if (!nextSensors || currentSensors === nextSensors) {
        return null;
      }

      return {
        Id: getRowNumber(row, 'Id'),
        sensors: nextSensors,
      };
    })
    .filter(Boolean);

  if (!patchPayload.length) {
    console.log('device_specs: no sensor updates needed');
    return;
  }

  if (!APPLY) {
    console.log(`DRY RUN populate device_specs.sensors for ${patchPayload.length} row(s)`);
    return;
  }

  await patchRecords(baseUrl, token, tables.get('device_specs'), patchPayload);
  console.log(`Populated device_specs.sensors for ${patchPayload.length} row(s)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
