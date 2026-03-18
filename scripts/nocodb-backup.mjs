import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const PAGE_SIZE = 200;

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
    throw new Error('Missing NocoDB config. Set NOCODB_BASE_ID and provide base URL + token in env or .env.');
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token,
    baseId,
  };
}

async function apiFetch(url, token) {
  const response = await fetch(url, {
    headers: {
      'xc-token': token,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed ${response.status} ${response.statusText} for ${url}\n${body}`);
  }

  return response.json();
}

async function exportAllRecords(baseUrl, token, tableId) {
  let offset = 0;
  const allRows = [];

  while (true) {
    const url = new URL(`${baseUrl}/api/v2/tables/${tableId}/records`);
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('limit', String(PAGE_SIZE));

    const page = await apiFetch(url, token);
    const rows = Array.isArray(page.list) ? page.list : [];
    allRows.push(...rows);

    if (rows.length < PAGE_SIZE) {
      return {
        rows: allRows,
        pageInfo: page.pageInfo ?? null,
      };
    }

    offset += PAGE_SIZE;
  }
}

async function main() {
  const { baseUrl, token, baseId } = await loadConfig();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(ROOT, 'backups', `nocodb-${stamp}`);
  const tableDir = path.join(backupDir, 'tables');

  await fs.mkdir(tableDir, { recursive: true });

  const baseMeta = await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token);
  const tables = Array.isArray(baseMeta.list) ? baseMeta.list : [];

  await fs.writeFile(
    path.join(backupDir, 'tables.index.json'),
    JSON.stringify(tables, null, 2),
    'utf8',
  );

  for (const table of tables) {
    const tableMeta = await apiFetch(`${baseUrl}/api/v2/meta/tables/${table.id}`, token);
    const records = await exportAllRecords(baseUrl, token, table.id);
    const safeTitle = table.title.replace(/[^a-z0-9_-]/gi, '_');

    await fs.writeFile(
      path.join(tableDir, `${safeTitle}.schema.json`),
      JSON.stringify(tableMeta, null, 2),
      'utf8',
    );

    await fs.writeFile(
      path.join(tableDir, `${safeTitle}.records.json`),
      JSON.stringify(records, null, 2),
      'utf8',
    );

    console.log(`Backed up ${table.title}: ${records.rows.length} rows`);
  }

  console.log(`Backup complete: ${backupDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
