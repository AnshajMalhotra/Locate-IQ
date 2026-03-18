import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');

const BACKFILL_CONFIG = [
  {
    table: 'device_specs',
    sourceKey: 'device_key',
    linkColumn: 'device_ref',
    targetTable: 'devices',
    targetKey: 'device_key',
  },
  {
    table: 'gateway_protocol_profiles',
    sourceKey: 'device_key',
    linkColumn: 'device_ref',
    targetTable: 'devices',
    targetKey: 'device_key',
  },
  {
    table: 'anchor_positioning_profiles',
    sourceKey: 'device_key',
    linkColumn: 'device_ref',
    targetTable: 'devices',
    targetKey: 'device_key',
  },
  {
    table: 'device_connectivity',
    sourceKey: 'device_key',
    linkColumn: 'device_ref',
    targetTable: 'devices',
    targetKey: 'device_key',
  },
  {
    table: 'device_connectivity',
    sourceKey: 'connectivity_key',
    linkColumn: 'connectivity_ref',
    targetTable: 'connectivity_options',
    targetKey: 'connectivity_key',
  },
  {
    table: 'device_protocols',
    sourceKey: 'device_key',
    linkColumn: 'device_ref',
    targetTable: 'devices',
    targetKey: 'device_key',
  },
  {
    table: 'device_protocols',
    sourceKey: 'protocol_key',
    linkColumn: 'protocol_ref',
    targetTable: 'protocols',
    targetKey: 'protocol_key',
  },
  {
    table: 'device_applications',
    sourceKey: 'device_key',
    linkColumn: 'device_ref',
    targetTable: 'devices',
    targetKey: 'device_key',
  },
  {
    table: 'device_applications',
    sourceKey: 'application_key',
    linkColumn: 'application_ref',
    targetTable: 'applications',
    targetKey: 'application_key',
  },
  {
    table: 'device_tags',
    sourceKey: 'device_key',
    linkColumn: 'device_ref',
    targetTable: 'devices',
    targetKey: 'device_key',
  },
  {
    table: 'device_tags',
    sourceKey: 'tag_key',
    linkColumn: 'tag_ref',
    targetTable: 'business_tags',
    targetKey: 'tag_key',
  },
];

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

async function fetchAllRecords(baseUrl, token, tableId) {
  const url = new URL(`${baseUrl}/api/v2/tables/${tableId}/records`);
  url.searchParams.set('limit', '500');
  const response = await apiFetch(url, token);
  return response.list ?? [];
}

function getLinkedId(value) {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === 'object' && 'Id' in first) {
      return String(first.Id);
    }
  }

  if (value && typeof value === 'object' && 'Id' in value) {
    return String(value.Id);
  }

  return null;
}

async function linkRecord(baseUrl, token, tableId, linkColumnId, recordId, relatedId) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/links/${linkColumnId}/records/${recordId}`, token, {
    method: 'POST',
    body: JSON.stringify({ Id: relatedId }),
  });
}

async function main() {
  const { baseUrl, token, baseId } = await loadConfig();
  const tableIndex = await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token);
  const tables = new Map((tableIndex.list ?? []).map((table) => [table.title, table]));

  for (const config of BACKFILL_CONFIG) {
    const table = tables.get(config.table);
    const targetTable = tables.get(config.targetTable);

    if (!table || !targetTable) {
      console.log(`Skipping ${config.table}.${config.linkColumn}: table metadata missing`);
      continue;
    }

    const tableMeta = await apiFetch(`${baseUrl}/api/v2/meta/tables/${table.id}`, token);
    const linkColumn = (tableMeta.columns ?? []).find(
      (column) => column.column_name === config.linkColumn || column.title === config.linkColumn,
    );

    if (!linkColumn) {
      console.log(`Skipping ${config.table}.${config.linkColumn}: linked-record column not found`);
      continue;
    }

    const [records, targetRecords] = await Promise.all([
      fetchAllRecords(baseUrl, token, table.id),
      fetchAllRecords(baseUrl, token, targetTable.id),
    ]);

    const targetByKey = new Map(targetRecords.map((record) => [record[config.targetKey], record]));
    let planned = 0;

    for (const record of records) {
      const sourceValue = record[config.sourceKey];
      if (!sourceValue) continue;

      const existingLinkId =
        getLinkedId(record[config.linkColumn]) ??
        (record[linkColumn.fk_child_column_id] ? String(record[linkColumn.fk_child_column_id]) : null);

      const targetRecord = targetByKey.get(sourceValue);
      if (!targetRecord) {
        console.log(`No target match for ${config.table}.${config.linkColumn} source=${sourceValue}`);
        continue;
      }

      if (existingLinkId === String(targetRecord.Id)) {
        continue;
      }

      planned += 1;

      if (!APPLY) {
        continue;
      }

      await linkRecord(baseUrl, token, table.id, linkColumn.id, record.Id, targetRecord.Id);
    }

    console.log(
      APPLY
        ? `${config.table}.${config.linkColumn}: linked ${planned} record(s)`
        : `DRY RUN ${config.table}.${config.linkColumn}: would link ${planned} record(s)`,
    );
  }

  console.log(APPLY ? 'Linked-record backfill applied.' : 'Dry run complete. Re-run with --apply to backfill linked records.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
