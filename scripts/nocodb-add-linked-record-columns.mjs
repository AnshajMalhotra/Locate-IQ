import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');

const LINK_FIELD_SETS = {
  device_specs: [
    { title: 'device_ref', column_name: 'device_ref', parent: 'devices', type: 'bt' },
  ],
  gateway_protocol_profiles: [
    { title: 'device_ref', column_name: 'device_ref', parent: 'devices', type: 'bt' },
  ],
  anchor_positioning_profiles: [
    { title: 'device_ref', column_name: 'device_ref', parent: 'devices', type: 'bt' },
  ],
  device_connectivity: [
    { title: 'device_ref', column_name: 'device_ref', parent: 'devices', type: 'bt' },
    { title: 'connectivity_ref', column_name: 'connectivity_ref', parent: 'connectivity_options', type: 'bt' },
  ],
  device_protocols: [
    { title: 'device_ref', column_name: 'device_ref', parent: 'devices', type: 'bt' },
    { title: 'protocol_ref', column_name: 'protocol_ref', parent: 'protocols', type: 'bt' },
  ],
  device_applications: [
    { title: 'device_ref', column_name: 'device_ref', parent: 'devices', type: 'bt' },
    { title: 'application_ref', column_name: 'application_ref', parent: 'applications', type: 'bt' },
  ],
  device_tags: [
    { title: 'device_ref', column_name: 'device_ref', parent: 'devices', type: 'bt' },
    { title: 'tag_ref', column_name: 'tag_ref', parent: 'business_tags', type: 'bt' },
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
    throw new Error('Missing NocoDB config. Set base URL, API token, and NOCODB_BASE_ID in env or .env.');
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
  const tables = new Map((tableIndex.list ?? []).map((table) => [table.title, table]));

  for (const [tableTitle, links] of Object.entries(LINK_FIELD_SETS)) {
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

  console.log(APPLY ? 'Linked-record columns applied.' : 'Dry run complete. Re-run with --apply to create linked-record columns.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
