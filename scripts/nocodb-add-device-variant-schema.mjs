import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');

const DEVICE_FIELDS = [
  ['variant_group', 'SingleLineText'],
];

const TABLE_DEFINITIONS = [
  {
    title: 'device_variants',
    table_name: 'device_variants',
    columns: [
      ['title', 'SingleLineText'],
      ['variant_key', 'SingleLineText'],
      ['device_key', 'SingleLineText'],
      ['variant_label', 'SingleLineText'],
      ['chipset', 'SingleLineText'],
      ['work_modes', 'LongText'],
      ['firmware_summary', 'LongText'],
      ['sensors', 'LongText'],
      ['other_notes', 'LongText'],
      ['sort_order', 'Number'],
    ],
  },
];

const LINK_DEFINITIONS = {
  device_variants: [
    { title: 'device_ref', column_name: 'device_ref', parent: 'devices', type: 'bt' },
  ],
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
    throw new Error('Missing NocoDB config. Set NOCODB_BASE_ID and provide base URL + token in env or .env.');
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

function payloadFor([columnName, uidt]) {
  const base = {
    title: columnName,
    column_name: columnName,
    uidt,
    pk: false,
    rqd: false,
    un: false,
    ai: false,
  };

  if (uidt === 'Checkbox') {
    return { ...base, dt: 'boolean', cdf: '0' };
  }

  if (uidt === 'Number') {
    return { ...base, dt: 'integer' };
  }

  if (uidt === 'LongText') {
    return { ...base, dt: 'text' };
  }

  return { ...base, dt: 'varchar' };
}

async function getTables(baseUrl, token, baseId) {
  const tableIndex = await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token);
  return new Map((tableIndex.list ?? []).map((table) => [table.title, table]));
}

async function ensureTable(baseUrl, token, baseId, definition) {
  let tables = await getTables(baseUrl, token, baseId);
  const existing = tables.get(definition.title);

  if (existing) {
    console.log(`${definition.title}: already exists`);
    return existing;
  }

  if (!APPLY) {
    console.log(`DRY RUN create table ${definition.title}`);
    return null;
  }

  const payload = {
    table_name: definition.table_name,
    title: definition.title,
    columns: definition.columns.map(payloadFor),
  };

  await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  console.log(`Created table ${definition.title}`);
  tables = await getTables(baseUrl, token, baseId);
  const created = tables.get(definition.title);
  if (!created) {
    throw new Error(`Table ${definition.title} was created but could not be reloaded from metadata.`);
  }

  return created;
}

async function ensureFields(baseUrl, token, table, fields) {
  const meta = await apiFetch(`${baseUrl}/api/v2/meta/tables/${table.id}`, token);
  const existing = new Set((meta.columns ?? []).map((column) => column.column_name));
  const missing = fields.filter(([columnName]) => !existing.has(columnName));

  if (!missing.length) {
    console.log(`${table.title}: no missing fields`);
    return;
  }

  for (const field of missing) {
    if (!APPLY) {
      console.log(`DRY RUN add ${table.title}.${field[0]} (${field[1]})`);
      continue;
    }

    await apiFetch(`${baseUrl}/api/v2/meta/tables/${table.id}/columns`, token, {
      method: 'POST',
      body: JSON.stringify(payloadFor(field)),
    });

    console.log(`Added ${table.title}.${field[0]} (${field[1]})`);
  }
}

async function ensureLinkColumns(baseUrl, token, baseId, linksByTable) {
  const tables = await getTables(baseUrl, token, baseId);

  for (const [tableTitle, links] of Object.entries(linksByTable)) {
    const table = tables.get(tableTitle);
    if (!table) {
      console.log(`Skipping ${tableTitle}: table not found`);
      continue;
    }

    const meta = await apiFetch(`${baseUrl}/api/v2/meta/tables/${table.id}`, token);
    const existing = new Set((meta.columns ?? []).map((column) => column.column_name));

    for (const link of links) {
      const parentTable = tables.get(link.parent);
      if (!parentTable) {
        console.log(`Skipping ${tableTitle}.${link.column_name}: parent table ${link.parent} not found`);
        continue;
      }

      if (existing.has(link.column_name)) {
        console.log(`${tableTitle}.${link.column_name}: already exists`);
        continue;
      }

      const payload = {
        title: link.title,
        column_name: link.column_name,
        uidt: 'Links',
        parentId: parentTable.id,
        childId: table.id,
        type: link.type,
      };

      if (!APPLY) {
        console.log(`DRY RUN add ${tableTitle}.${link.column_name} -> ${link.parent} (${link.type})`);
        continue;
      }

      await apiFetch(`${baseUrl}/api/v2/meta/tables/${table.id}/columns`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log(`Added ${tableTitle}.${link.column_name} -> ${link.parent} (${link.type})`);
    }
  }
}

async function main() {
  const { baseUrl, token, baseId } = await loadConfig();
  let tables = await getTables(baseUrl, token, baseId);
  const devicesTable = tables.get('devices');

  if (!devicesTable) {
    throw new Error('devices table not found');
  }

  await ensureFields(baseUrl, token, devicesTable, DEVICE_FIELDS);

  for (const definition of TABLE_DEFINITIONS) {
    await ensureTable(baseUrl, token, baseId, definition);
  }

  if (!APPLY) {
    await ensureLinkColumns(baseUrl, token, baseId, LINK_DEFINITIONS);
    console.log('Dry run complete. Re-run with --apply to create device variant schema.');
    return;
  }

  tables = await getTables(baseUrl, token, baseId);
  for (const definition of TABLE_DEFINITIONS) {
    const table = tables.get(definition.title);
    if (!table) {
      throw new Error(`Expected table ${definition.title} to exist after schema check.`);
    }

    await ensureFields(baseUrl, token, table, definition.columns);
  }

  await ensureLinkColumns(baseUrl, token, baseId, LINK_DEFINITIONS);

  console.log('Device variant schema applied.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
