import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');

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

function splitSensorField(value) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function main() {
  const { baseUrl, token, baseId } = await loadConfig();
  const tableIndex = await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token);
  const tables = new Map((tableIndex.list ?? []).map((table) => [table.title, table]));
  const specsTable = tables.get('device_specs');
  const variantsTable = tables.get('device_variants');

  if (!specsTable) {
    throw new Error('device_specs table not found');
  }

  const specsMeta = await apiFetch(`${baseUrl}/api/v2/meta/tables/${specsTable.id}`, token);
  const sensorsColumn = (specsMeta.columns ?? []).find((column) => column.column_name === 'sensors');
  if (!sensorsColumn) {
    throw new Error('device_specs.sensors column not found');
  }

  const [specRows, variantRows] = await Promise.all([
    fetchAll(baseUrl, token, specsTable.id),
    variantsTable ? fetchAll(baseUrl, token, variantsTable.id) : [],
  ]);

  const options = [
    ...new Set(
      [
        ...specRows.flatMap((row) => splitSensorField(getRowString(row, 'sensors'))),
        ...variantRows.flatMap((row) => splitSensorField(getRowString(row, 'sensors'))),
      ].filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  if (!options.length) {
    console.log('device_specs.sensors: no option values discovered');
    return;
  }

  if (!APPLY) {
    console.log(`DRY RUN convert device_specs.sensors to MultiSelect with ${options.length} option(s)`);
  } else {
    await apiFetch(`${baseUrl}/api/v2/meta/columns/${sensorsColumn.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({
        title: sensorsColumn.title,
        column_name: sensorsColumn.column_name,
        uidt: 'MultiSelect',
        dt: 'text',
        dtxp: options.join(','),
        pk: false,
        rqd: Boolean(sensorsColumn.rqd),
        un: Boolean(sensorsColumn.un),
        ai: false,
      }),
    });
    console.log(`Converted device_specs.sensors to MultiSelect with ${options.length} option(s)`);
  }

  const patchPayload = specRows
    .map((row) => {
      const normalized = splitSensorField(getRowString(row, 'sensors')).join(',');
      const current = getRowString(row, 'sensors');
      if (!normalized || normalized === current) {
        return null;
      }

      return {
        Id: getRowNumber(row, 'Id'),
        sensors: normalized,
      };
    })
    .filter(Boolean);

  if (!patchPayload.length) {
    console.log('device_specs: no sensor value normalization needed');
    return;
  }

  if (!APPLY) {
    console.log(`DRY RUN normalize device_specs.sensors values for ${patchPayload.length} row(s)`);
    return;
  }

  await patchRecords(baseUrl, token, specsTable.id, patchPayload);
  console.log(`Normalized device_specs.sensors values for ${patchPayload.length} row(s)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
