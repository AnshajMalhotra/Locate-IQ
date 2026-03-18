import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');
const BASE_ID = 'pys78cyayu9qnx1';

const protocolSeeds = [
  {
    title: 'BLE',
    protocol_key: 'proto_ble',
    protocol_name: 'BLE',
    description: 'Bluetooth Low Energy advertising / broadcast protocol',
  },
];

const deviceConnectivitySeeds = [
  {
    title: 'anchor_l01a | conn_ble',
    device_key: 'anchor_l01a',
    connectivity_key: 'conn_ble',
    details: 'BLE 5.1 broadcast anchor',
  },
  {
    title: 'anchor_l03 | conn_ble',
    device_key: 'anchor_l03',
    connectivity_key: 'conn_ble',
    details: 'BLE 5.1 broadcast anchor',
  },
  {
    title: 'anchor_l04 | conn_ble',
    device_key: 'anchor_l04',
    connectivity_key: 'conn_ble',
    details: 'BLE 5.1 navigation anchor',
  },
];

const deviceProtocolSeeds = [
  {
    title: 'anchor_l01a | proto_ble | broadcast',
    device_key: 'anchor_l01a',
    protocol_key: 'proto_ble',
    direction: 'broadcast',
    details: 'Validated from reviewed L01A anchor brief and research notes.',
  },
  {
    title: 'anchor_l03 | proto_ble | broadcast',
    device_key: 'anchor_l03',
    protocol_key: 'proto_ble',
    direction: 'broadcast',
    details: 'Validated from reviewed L03 anchor brief and research notes.',
  },
  {
    title: 'anchor_l04 | proto_ble | broadcast',
    device_key: 'anchor_l04',
    protocol_key: 'proto_ble',
    direction: 'broadcast',
    details: 'Validated from reviewed L04 anchor brief and research notes.',
  },
];

const anchorProfileUpdates = {
  anchor_l01a: {
    network_protocols: 'BLE 5.1',
    notes: 'Reviewed wayfinding anchor brief confirms BLE 5.1 battery-powered anchor deployment.',
  },
  anchor_l03: {
    network_protocols: 'BLE 5.1',
    notes: 'Reviewed L03 anchor brief confirms BLE 5.1 battery-powered anchor deployment.',
  },
  anchor_l04: {
    network_protocols: 'BLE 5.1',
    notes: 'Reviewed L04 navigation anchor brief confirms BLE 5.1 battery-powered anchor deployment.',
  },
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

async function createRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'POST',
    body: JSON.stringify(records),
  });
}

async function patchRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'PATCH',
    body: JSON.stringify(records),
  });
}

async function ensureRecords({ baseUrl, token, tableId, keyField, records, label }) {
  const existing = await fetchAll(baseUrl, token, tableId);
  const existingKeys = new Set(existing.map((row) => row[keyField]));
  const missing = records.filter((record) => !existingKeys.has(record[keyField]));

  if (!missing.length) {
    console.log(`${label}: no new records needed`);
    return;
  }

  if (!APPLY) {
    console.log(`${label}: would create ${missing.length} record(s)`);
    return;
  }

  await createRecords(baseUrl, token, tableId, missing);
  console.log(`${label}: created ${missing.length} record(s)`);
}

async function applyAnchorProfileUpdates({ baseUrl, token, tableId }) {
  const existing = await fetchAll(baseUrl, token, tableId);
  const byDeviceKey = new Map(existing.map((row) => [row.device_key, row]));
  const patchPayload = [];

  for (const [deviceKey, updates] of Object.entries(anchorProfileUpdates)) {
    const row = byDeviceKey.get(deviceKey);
    if (!row) {
      console.log(`anchor_positioning_profiles: missing ${deviceKey}`);
      continue;
    }

    const nextPayload = { Id: row.Id, ...updates };
    const hasChange = Object.entries(updates).some(([field, value]) => row[field] !== value);
    if (hasChange) {
      patchPayload.push(nextPayload);
    }
  }

  if (!patchPayload.length) {
    console.log('anchor_positioning_profiles: no updates needed');
    return;
  }

  if (!APPLY) {
    console.log(`anchor_positioning_profiles: would update ${patchPayload.length} record(s)`);
    return;
  }

  await patchRecords(baseUrl, token, tableId, patchPayload);
  console.log(`anchor_positioning_profiles: updated ${patchPayload.length} record(s)`);
}

async function main() {
  const { baseUrl, token } = await loadConfig();
  const tablesResponse = await apiFetch(`${baseUrl}/api/v2/meta/bases/${BASE_ID}/tables`, token);
  const tables = new Map((tablesResponse.list ?? []).map((table) => [table.title, table.id]));

  await ensureRecords({
    baseUrl,
    token,
    tableId: tables.get('protocols'),
    keyField: 'protocol_key',
    records: protocolSeeds,
    label: 'protocols',
  });
  await ensureRecords({
    baseUrl,
    token,
    tableId: tables.get('device_connectivity'),
    keyField: 'title',
    records: deviceConnectivitySeeds,
    label: 'device_connectivity',
  });
  await ensureRecords({
    baseUrl,
    token,
    tableId: tables.get('device_protocols'),
    keyField: 'title',
    records: deviceProtocolSeeds,
    label: 'device_protocols',
  });
  await applyAnchorProfileUpdates({
    baseUrl,
    token,
    tableId: tables.get('anchor_positioning_profiles'),
  });

  console.log(APPLY ? 'Anchor protocol/connectivity backfill applied.' : 'Dry run complete. Re-run with --apply to write updates.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
