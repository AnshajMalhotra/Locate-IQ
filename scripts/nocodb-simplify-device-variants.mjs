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

function payloadForFirmwareSummary() {
  return {
    title: 'firmware_summary',
    column_name: 'firmware_summary',
    uidt: 'LongText',
    dt: 'text',
    pk: false,
    rqd: false,
    un: false,
    ai: false,
  };
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
  const tables = new Map((tableIndex.list ?? []).map((table) => [table.title, table]));
  const variantTable = tables.get('device_variants');

  if (!variantTable) {
    throw new Error('device_variants table not found');
  }

  const variantMeta = await apiFetch(`${baseUrl}/api/v2/meta/tables/${variantTable.id}`, token);
  const existingColumns = new Set((variantMeta.columns ?? []).map((column) => column.column_name));

  if (!existingColumns.has('firmware_summary')) {
    if (!APPLY) {
      console.log('DRY RUN add device_variants.firmware_summary (LongText)');
    } else {
      await apiFetch(`${baseUrl}/api/v2/meta/tables/${variantTable.id}/columns`, token, {
        method: 'POST',
        body: JSON.stringify(payloadForFirmwareSummary()),
      });
      console.log('Added device_variants.firmware_summary (LongText)');
    }
  } else {
    console.log('device_variants.firmware_summary: already exists');
  }

  console.log('device_variants: no firmware table backfill required in simplified schema');

  console.log(APPLY ? 'Device variant simplification applied.' : 'Dry run complete. Re-run with --apply to simplify device variants.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
