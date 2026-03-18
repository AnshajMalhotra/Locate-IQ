import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');

const FIELD_SETS = {
  gateway_protocol_profiles: [
    ['mqtt_topic_example', 'SingleLineText'],
    ['mqtt_topic_hierarchy_notes', 'LongText'],
    ['mqtt_payload_json_example', 'LongText'],
    ['mqtt_payload_field_notes', 'LongText'],
    ['websocket_endpoint', 'SingleLineText'],
    ['websocket_auth_method', 'SingleLineText'],
    ['websocket_heartbeat_interval_sec', 'Number'],
    ['websocket_payload_notes', 'LongText'],
    ['https_endpoint', 'SingleLineText'],
    ['https_method', 'SingleLineText'],
    ['https_auth_method', 'SingleLineText'],
    ['https_headers_example', 'LongText'],
    ['https_body_example', 'LongText'],
    ['downlink_command_channel', 'SingleLineText'],
    ['downlink_command_example', 'LongText'],
    ['configurable_parameters', 'LongText'],
    ['supports_refresh_rate_config', 'Checkbox'],
    ['supports_led_control', 'Checkbox'],
    ['supports_buzzer_control', 'Checkbox'],
    ['edge_computing_mode', 'SingleLineText'],
    ['calculates_coordinates_locally', 'Checkbox'],
    ['forwards_raw_signals', 'Checkbox'],
    ['central_engine_dependency', 'SingleLineText'],
    ['node_red_integration_ready', 'Checkbox'],
    ['third_party_platform_notes', 'LongText'],
  ],
  device_specs: [
    ['rj45_support', 'Checkbox'],
    ['poe_mode', 'SingleLineText'],
    ['backhaul_type', 'SingleLineText'],
    ['lte_support', 'Checkbox'],
    ['lte_category', 'SingleLineText'],
    ['indoor_outdoor_rating', 'SingleLineText'],
    ['mounting_options_normalized', 'LongText'],
    ['mounting_difficulty', 'SingleLineText'],
    ['recommended_spare_parts', 'LongText'],
    ['max_signal_range_open_space', 'SingleLineText'],
    ['max_signal_range_real_world', 'SingleLineText'],
    ['sop_path', 'LongText'],
    ['manual_path', 'LongText'],
  ],
  anchor_positioning_profiles: [
    ['backhaul_type', 'SingleLineText'],
    ['poe_support', 'Checkbox'],
    ['poe_standard', 'SingleLineText'],
    ['sync_requirement', 'SingleLineText'],
    ['recommended_anchor_spacing', 'SingleLineText'],
    ['recommended_anchor_density', 'SingleLineText'],
    ['line_of_sight_requirement', 'SingleLineText'],
    ['metal_interference_risk', 'SingleLineText'],
    ['raw_signal_forwarding', 'Checkbox'],
    ['positioning_engine_location', 'SingleLineText'],
    ['installation_prerequisites', 'LongText'],
    ['commissioning_notes', 'LongText'],
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

async function main() {
  const { baseUrl, token, baseId } = await loadConfig();
  const tableIndex = await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token);
  const tables = new Map((tableIndex.list ?? []).map((table) => [table.title, table]));

  for (const [tableTitle, fields] of Object.entries(FIELD_SETS)) {
    const table = tables.get(tableTitle);
    if (!table) {
      console.log(`Skipping ${tableTitle}: table not found`);
      continue;
    }

    const meta = await apiFetch(`${baseUrl}/api/v2/meta/tables/${table.id}`, token);
    const existing = new Set((meta.columns ?? []).map((column) => column.column_name));
    const missing = fields.filter(([columnName]) => !existing.has(columnName));

    if (missing.length === 0) {
      console.log(`${tableTitle}: no missing fields`);
      continue;
    }

    console.log(`${tableTitle}: ${missing.length} missing field(s)`);

    for (const field of missing) {
      const payload = payloadFor(field);

      if (!APPLY) {
        console.log(`DRY RUN add ${tableTitle}.${field[0]} (${field[1]})`);
        continue;
      }

      await apiFetch(`${baseUrl}/api/v2/meta/tables/${table.id}/columns`, token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log(`Added ${tableTitle}.${field[0]} (${field[1]})`);
    }
  }

  console.log(APPLY ? 'Schema update applied.' : 'Dry run complete. Re-run with --apply to create fields.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
