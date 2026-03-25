import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');

const MERGED_KEY = 'conn_ethernet_poe';
const MERGED_LABEL = 'Ethernet / PoE';

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
  url.searchParams.set('limit', '500');
  const response = await apiFetch(url, token);
  return Array.isArray(response) ? response : response.list ?? response.data ?? [];
}

async function patchRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'PATCH',
    body: JSON.stringify(records),
  });
}

async function createRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'POST',
    body: JSON.stringify(records),
  });
}

async function deleteRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'DELETE',
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
  const connectivityTableId = tables.get('connectivity_options');
  const deviceConnectivityTableId = tables.get('device_connectivity');

  if (!connectivityTableId || !deviceConnectivityTableId) {
    throw new Error('connectivity_options or device_connectivity table not found');
  }

  const [options, links] = await Promise.all([
    fetchAll(baseUrl, token, connectivityTableId),
    fetchAll(baseUrl, token, deviceConnectivityTableId),
  ]);

  let mergedOption = options.find((row) => getRowString(row, 'connectivity_key') === MERGED_KEY);

  if (!mergedOption && !APPLY) {
    console.log(`DRY RUN create connectivity_options row ${MERGED_KEY} (${MERGED_LABEL})`);
  }

  if (!mergedOption && APPLY) {
    const created = await createRecords(baseUrl, token, connectivityTableId, [
      {
        title: MERGED_LABEL,
        connectivity_key: MERGED_KEY,
        connectivity_type: MERGED_LABEL,
      },
    ]);
    mergedOption = Array.isArray(created) ? created[0] : created;
    console.log(`Created connectivity option ${MERGED_KEY}`);
  }

  const mergedOptionId = getRowNumber(mergedOption ?? {}, 'Id');
  const affected = links.filter((row) => {
    const key = getRowString(row, 'connectivity_key');
    return key === 'conn_eth' || key === 'conn_poe';
  });

  const rowsToPatch = [];
  const rowsToDelete = [];
  const seenDeviceKeys = new Set();

  for (const row of affected) {
    const deviceKey = getRowString(row, 'device_key');
    if (!deviceKey) continue;

    if (!seenDeviceKeys.has(deviceKey)) {
      seenDeviceKeys.add(deviceKey);
      rowsToPatch.push({
        Id: getRowNumber(row, 'Id'),
        title: `${deviceKey} | ${MERGED_KEY}`,
        device_key: deviceKey,
        connectivity_key: MERGED_KEY,
        details: MERGED_LABEL,
        ...(mergedOptionId ? { nc_24rw___connectivity_options_id: mergedOptionId } : {}),
      });
    } else {
      rowsToDelete.push({ Id: getRowNumber(row, 'Id') });
    }
  }

  if (!rowsToPatch.length && !rowsToDelete.length) {
    console.log('device_connectivity: no Ethernet/PoE merge updates needed');
    return;
  }

  if (!APPLY) {
    console.log(`DRY RUN patch ${rowsToPatch.length} device_connectivity row(s) to ${MERGED_KEY}`);
    console.log(`DRY RUN delete ${rowsToDelete.length} duplicate Ethernet/PoE row(s)`);
    return;
  }

  if (rowsToPatch.length) {
    await patchRecords(baseUrl, token, deviceConnectivityTableId, rowsToPatch);
    console.log(`Patched ${rowsToPatch.length} device_connectivity row(s)`);
  }

  if (rowsToDelete.length) {
    await deleteRecords(baseUrl, token, deviceConnectivityTableId, rowsToDelete);
    console.log(`Deleted ${rowsToDelete.length} duplicate device_connectivity row(s)`);
  }

  console.log('Connectivity merge applied.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
