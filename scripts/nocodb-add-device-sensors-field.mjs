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

async function main() {
  const { baseUrl, token, baseId } = await loadConfig();
  const tableIndex = await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token);
  const specsTable = (tableIndex.list ?? []).find((table) => table.title === 'device_specs');

  if (!specsTable) {
    throw new Error('device_specs table not found');
  }

  const meta = await apiFetch(`${baseUrl}/api/v2/meta/tables/${specsTable.id}`, token);
  const existing = new Set((meta.columns ?? []).map((column) => column.column_name));

  if (existing.has('sensors')) {
    console.log('device_specs.sensors: already exists');
    return;
  }

  if (!APPLY) {
    console.log('DRY RUN add device_specs.sensors (MultiSelect)');
    return;
  }

  await apiFetch(`${baseUrl}/api/v2/meta/tables/${specsTable.id}/columns`, token, {
    method: 'POST',
    body: JSON.stringify({
      title: 'sensors',
      column_name: 'sensors',
      uidt: 'MultiSelect',
      dt: 'text',
      dtxp: '',
      pk: false,
      rqd: false,
      un: false,
      ai: false,
    }),
  });

  console.log('Added device_specs.sensors (MultiSelect)');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
