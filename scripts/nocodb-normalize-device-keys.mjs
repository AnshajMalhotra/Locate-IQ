import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const AUDIT_PATH = path.join(ROOT, 'tmp', 'device-key-normalization-audit.json');
const APPLY = process.argv.includes('--apply');

const TABLE_IDS = {
  devices: 'm9qmti5iiexuqy0',
  deviceSpecs: 'memlisdc3xexytd',
  deviceConnectivity: 'matcygk3ad9amdh',
  deviceProtocols: 'm18o650glclxota',
  deviceApplications: 'm1jj5i417hc407k',
  deviceTags: 'mvrow0le5anxvcc',
  anchorProfiles: 'm2w2nv5ygb0nz0t',
  gatewayProfiles: 'momj1rwqmub764f',
  deviceVariants: 'msmzgfblv22rlkh',
};

const KEY_RENAMES = {
  anchor_l05_usb_beacon: 'beacon_l05_usb_beacon',
  beacon_m1p_led_tag: 'tag_m1p_led_tag',
  beacon_m5_high_temp_tag: 'tag_m5_high_temp_tag',
  beacon_m2_multi_variant_tag: 'tag_m2_multi_variant_tag',
  tag_h6_light_sensor_beacon: 'beacon_h6_light_sensor_beacon',
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
  const baseUrl =
    process.env.NOCODB_BASE_URL ??
    process.env.VITE_NOCODB_BASE_URL ??
    fileValues.NOCODB_BASE_URL ??
    fileValues.VITE_NOCODB_BASE_URL;
  const token =
    process.env.NOCODB_API_TOKEN ??
    process.env.VITE_NOCODB_API_KEY ??
    fileValues.NOCODB_API_TOKEN ??
    fileValues.VITE_NOCODB_API_KEY;

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
  url.searchParams.set('limit', '500');
  const response = await apiFetch(url, token);
  return response.list ?? [];
}

async function patchRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'PATCH',
    body: JSON.stringify(records),
  });
}

function getRowString(row, key) {
  return typeof row?.[key] === 'string' ? row[key] : '';
}

function patchTitle(title, oldKey, nextKey) {
  if (typeof title !== 'string' || !title) return title;
  return title.includes(oldKey) ? title.replaceAll(oldKey, nextKey) : title;
}

function buildPatch(row, oldKey, nextKey, extra = {}) {
  const patch = {
    Id: row.Id,
    device_key: nextKey,
    ...extra,
  };

  if (typeof row.title === 'string') {
    patch.title = patchTitle(row.title, oldKey, nextKey);
  }

  return patch;
}

async function main() {
  const { baseUrl, token } = await loadConfig();
  const tableEntries = Object.entries(TABLE_IDS);
  const tables = Object.fromEntries(
    await Promise.all(
      tableEntries.map(async ([label, tableId]) => [label, await fetchAll(baseUrl, token, tableId)]),
    ),
  );

  const audit = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    renames: [],
  };

  for (const [oldKey, nextKey] of Object.entries(KEY_RENAMES)) {
    const renameAudit = {
      oldKey,
      nextKey,
      affected: {},
    };

    const deviceRow = tables.devices.find((row) => getRowString(row, 'device_key') === oldKey);
    if (deviceRow) {
      renameAudit.affected.devices = [deviceRow.Id];
      if (APPLY) {
        await patchRecords(baseUrl, token, TABLE_IDS.devices, [{ Id: deviceRow.Id, device_key: nextKey }]);
      }
    }

    const childTables = [
      ['deviceSpecs', 'device_specs'],
      ['deviceConnectivity', 'device_connectivity'],
      ['deviceProtocols', 'device_protocols'],
      ['deviceApplications', 'device_applications'],
      ['deviceTags', 'device_tags'],
      ['anchorProfiles', 'anchor_profiles'],
      ['gatewayProfiles', 'gateway_profiles'],
      ['deviceVariants', 'device_variants'],
    ];

    for (const [label, auditKey] of childTables) {
      const rows = tables[label].filter((row) => getRowString(row, 'device_key') === oldKey);
      if (!rows.length) continue;
      renameAudit.affected[auditKey] = rows.map((row) => row.Id);
      if (APPLY) {
        const patches = rows.map((row) => buildPatch(row, oldKey, nextKey));
        await patchRecords(baseUrl, token, TABLE_IDS[label], patches);
      }
    }

    audit.renames.push(renameAudit);
  }

  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  await fs.writeFile(AUDIT_PATH, JSON.stringify(audit, null, 2), 'utf8');

  console.log(`${APPLY ? 'Applied' : 'Prepared'} device key normalization.`);
  console.log(`Audit written to: ${AUDIT_PATH}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
