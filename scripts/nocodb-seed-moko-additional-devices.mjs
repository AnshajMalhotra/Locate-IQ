import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');
const BASE_ID = 'pys78cyayu9qnx1';

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
  url.searchParams.set('limit', '200');
  const response = await apiFetch(url, token);
  return response.list ?? [];
}

async function createRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'POST',
    body: JSON.stringify(records),
  });
}

const devices = [
  {
    title: 'L05 USB Beacon',
    device_key: 'anchor_l05_usb_beacon',
    device_name: 'L05 USB Beacon',
    manufacturer: 'MOKO SMART',
    model_number: 'L05',
    category: 'anchor',
    subcategory: 'USB BLE beacon',
    role: 'positioning infrastructure',
    description: 'Compact plug-and-play USB BLE beacon for indoor navigation and promotional applications; available in internal and external antenna variants.',
    datasheet_path: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\L05 USB Beacon Brief_241115.pdf',
    status: 'active',
  },
  {
    title: 'M1P LED Tag',
    device_key: 'beacon_m1p_led_tag',
    device_name: 'M1P LED Tag',
    manufacturer: 'MOKO SMART',
    model_number: 'M1P',
    category: 'beacon',
    subcategory: 'BLE LED asset tag',
    role: 'tag / beacon',
    description: 'Coin-sized BLE asset tag with remotely controlled high-brightness LED for last-meter item finding in crowded indoor spaces.',
    datasheet_path: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\M1P LED Tag Brief_241115.pdf',
    status: 'active',
  },
  {
    title: 'M5 High-Temp Resistant Tag',
    device_key: 'beacon_m5_high_temp_tag',
    device_name: 'M5 High-Temp Resistant Tag',
    manufacturer: 'MOKO SMART',
    model_number: 'M5',
    category: 'beacon',
    subcategory: 'High-temp BLE asset tag',
    role: 'tag / beacon',
    description: 'High-temperature resistant waterproof BLE asset tag designed for industrial tracking in steam cleaning, disinfection, and ultrasonic washer environments.',
    datasheet_path: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\M5 High-Temp Resistant Tag Product Brief_V1.0_20230704.pdf',
    status: 'active',
  },
];

const deviceSpecs = [
  {
    title: 'anchor_l05_usb_beacon',
    device_key: 'anchor_l05_usb_beacon',
    bluetooth_version: 'BLE (USB BLE beacon; nRF52 series)',
    wifi_support: false,
    wifi_band: '',
    ethernet_support: false,
    poe_support: false,
    poe_standard: '',
    cellular_support: false,
    cellular_type: '',
    gnss_support: false,
    battery_capacity: '',
    replaceable_battery: false,
    ip_rating: '',
    ik_rating: '',
    operating_temp_min_c: -20,
    operating_temp_max_c: 50,
    dimensions: '43.0 x 24.7 x 11.4 mm (L05I)',
    weight: '10.1g (L05I); 19.9g (L05E)',
    power_supply: 'USB',
    installation: 'Insert into USB port',
    material: 'ABS+PC',
    rj45_support: false,
    poe_mode: 'Not supported',
    backhaul_type: 'None (broadcast-only BLE anchor powered by USB)',
    lte_support: false,
    lte_category: 'Not applicable',
    indoor_outdoor_rating: 'Indoor USB-powered location anchor',
    mounting_options_normalized: 'Plug into USB port',
    max_signal_range_open_space: '150m (L05I); 250m (L05E)',
    max_signal_range_real_world: 'Vendor publishes obstacle-free range; actual coverage depends on indoor layout and USB placement.',
    manual_path: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\L05 USB Beacon Brief_241115.pdf',
  },
  {
    title: 'beacon_m1p_led_tag',
    device_key: 'beacon_m1p_led_tag',
    bluetooth_version: 'BLE 5.0',
    wifi_support: false,
    wifi_band: '',
    ethernet_support: false,
    poe_support: false,
    poe_standard: '',
    cellular_support: false,
    cellular_type: '',
    gnss_support: false,
    battery_capacity: 'CR2032 coin battery (replaceable)',
    replaceable_battery: true,
    ip_rating: '',
    ik_rating: '',
    operating_temp_min_c: -20,
    operating_temp_max_c: 60,
    dimensions: 'Phi 30 x 8 mm',
    weight: '6.2g with battery',
    power_supply: 'CR2032 replaceable battery',
    installation: '3M sticker',
    material: 'ABS',
    rj45_support: false,
    poe_mode: 'Not supported',
    backhaul_type: 'None (battery BLE tag)',
    lte_support: false,
    lte_category: 'Not applicable',
    indoor_outdoor_rating: 'Indoor BLE asset tag',
    mounting_options_normalized: '3M sticker',
    max_signal_range_open_space: '230m',
    max_signal_range_real_world: 'Vendor publishes obstacle-free BLE range; real-world indoor locating depends on site conditions.',
    manual_path: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\M1P LED Tag Brief_241115.pdf',
  },
  {
    title: 'beacon_m5_high_temp_tag',
    device_key: 'beacon_m5_high_temp_tag',
    bluetooth_version: 'BLE 5.0',
    wifi_support: false,
    wifi_band: '',
    ethernet_support: false,
    poe_support: false,
    poe_standard: '',
    cellular_support: false,
    cellular_type: '',
    gnss_support: false,
    battery_capacity: 'Industrial CR2450 | 550mAh',
    replaceable_battery: false,
    ip_rating: 'IP68',
    ik_rating: '',
    operating_temp_min_c: -25,
    operating_temp_max_c: 135,
    dimensions: '60.3 x 32.2 x 12.0 mm',
    weight: '25g',
    power_supply: 'Battery-powered',
    installation: 'Zip tie',
    material: 'PPSU',
    rj45_support: false,
    poe_mode: 'Not supported',
    backhaul_type: 'None (battery BLE tag)',
    lte_support: false,
    lte_category: 'Not applicable',
    indoor_outdoor_rating: 'Rugged waterproof / industrial high-temperature tag (IP68)',
    mounting_options_normalized: 'Zip tie',
    max_signal_range_open_space: '150m',
    max_signal_range_real_world: 'Vendor publishes open-area range; metal, steam, and industrial layout affect real deployment performance.',
    manual_path: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\M5 High-Temp Resistant Tag Product Brief_V1.0_20230704.pdf',
  },
];

const anchorProfiles = [
  {
    title: 'anchor_l05_usb_beacon',
    device_key: 'anchor_l05_usb_beacon',
    positioning_technology: 'BLE location anchor',
    positioning_accuracy: 'Anchor / beacon role; reviewed brief does not publish a numeric positioning accuracy value.',
    installation_height: 'Not publicly specified in reviewed brief.',
    coverage_area: 'Range-based coverage; 150m (L05I) or 250m (L05E) obstacle-free transmission.',
    network_protocols: 'BLE broadcast',
    cascade_supported: false,
    cascade_notes: '',
    mounting_mode: 'Insert into USB port',
    notes: 'USB-powered plug-and-play location anchor intended for indoor navigation or promotional applications.',
    backhaul_type: 'None (broadcast-only USB BLE anchor)',
    poe_support: false,
    poe_standard: '',
    sync_requirement: 'No wired sync documented; external navigation platform interprets the anchor deployment.',
    recommended_anchor_spacing: 'Not publicly specified; derive from 150m / 250m unobstructed range and site survey.',
    recommended_anchor_density: 'Not publicly specified in reviewed brief.',
    line_of_sight_requirement: 'Best coverage assumes obstacle-free conditions; indoor obstacles reduce range.',
    metal_interference_risk: 'Not publicly documented in reviewed brief.',
    raw_signal_forwarding: false,
    positioning_engine_location: 'External navigation / indoor positioning platform',
    installation_prerequisites: 'Available USB power port and suitable indoor placement for target coverage.',
    commissioning_notes: 'Commission in the customer navigation platform; no wired provisioning workflow is documented in the reviewed brief.',
  },
];

const businessTags = [
  {
    title: 'beacon',
    tag_key: 'tag_beacon',
    tag_name: 'beacon',
    description: 'Beacon / tag class device',
  },
];

const deviceConnectivity = [
  { title: 'anchor_l05_usb_beacon | conn_ble', device_key: 'anchor_l05_usb_beacon', connectivity_key: 'conn_ble', details: 'USB-powered BLE broadcaster' },
  { title: 'beacon_m1p_led_tag | conn_ble', device_key: 'beacon_m1p_led_tag', connectivity_key: 'conn_ble', details: 'Battery-powered BLE tag' },
  { title: 'beacon_m5_high_temp_tag | conn_ble', device_key: 'beacon_m5_high_temp_tag', connectivity_key: 'conn_ble', details: 'Industrial BLE tag' },
];

const deviceTags = [
  { title: 'anchor_l05_usb_beacon | tag_anchor', device_key: 'anchor_l05_usb_beacon', tag_key: 'tag_anchor' },
  { title: 'beacon_m1p_led_tag | tag_beacon', device_key: 'beacon_m1p_led_tag', tag_key: 'tag_beacon' },
  { title: 'beacon_m5_high_temp_tag | tag_beacon', device_key: 'beacon_m5_high_temp_tag', tag_key: 'tag_beacon' },
  { title: 'beacon_m5_high_temp_tag | tag_outdoor', device_key: 'beacon_m5_high_temp_tag', tag_key: 'tag_outdoor' },
];

async function ensureRecords({ baseUrl, token, tableId, keyField, records, label }) {
  const existing = await fetchAll(baseUrl, token, tableId);
  const existingKeys = new Set(existing.map((row) => row[keyField]));
  const missing = records.filter((record) => !existingKeys.has(record[keyField]));

  if (!missing.length) {
    console.log(`${label}: no new records needed`);
    return;
  }

  if (!APPLY) {
    console.log(`${label}: would create ${missing.length} record(s)`);
    return;
  }

  await createRecords(baseUrl, token, tableId, missing);
  console.log(`${label}: created ${missing.length} record(s)`);
}

async function main() {
  const { baseUrl, token } = await loadConfig();
  const tablesResponse = await apiFetch(`${baseUrl}/api/v2/meta/bases/${BASE_ID}/tables`, token);
  const tables = new Map((tablesResponse.list ?? []).map((table) => [table.title, table.id]));

  await ensureRecords({ baseUrl, token, tableId: tables.get('business_tags'), keyField: 'tag_key', records: businessTags, label: 'business_tags' });
  await ensureRecords({ baseUrl, token, tableId: tables.get('devices'), keyField: 'device_key', records: devices, label: 'devices' });
  await ensureRecords({ baseUrl, token, tableId: tables.get('device_specs'), keyField: 'device_key', records: deviceSpecs, label: 'device_specs' });
  await ensureRecords({ baseUrl, token, tableId: tables.get('anchor_positioning_profiles'), keyField: 'device_key', records: anchorProfiles, label: 'anchor_positioning_profiles' });
  await ensureRecords({ baseUrl, token, tableId: tables.get('device_connectivity'), keyField: 'title', records: deviceConnectivity, label: 'device_connectivity' });
  await ensureRecords({ baseUrl, token, tableId: tables.get('device_tags'), keyField: 'title', records: deviceTags, label: 'device_tags' });

  console.log(APPLY ? 'Additional MOKO devices seeded.' : 'Dry run complete. Re-run with --apply to create the new device records.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
