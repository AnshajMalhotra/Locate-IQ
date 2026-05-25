import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const AUDIT_PATH = path.join(ROOT, 'tmp', 'moko-inventory-workbook-audit.json');
const APPLY = process.argv.includes('--apply');

const TABLE_IDS = {
  devices: 'm9qmti5iiexuqy0',
  deviceSpecs: 'memlisdc3xexytd',
  connectivityOptions: 'mxncb34nggu29us',
  deviceConnectivity: 'matcygk3ad9amdh',
  protocols: 'm0kgf62uwun29bh',
  deviceProtocols: 'm18o650glclxota',
  applications: 'mhhyhm4qlc8btgc',
  deviceApplications: 'm1jj5i417hc407k',
  businessTags: 'mcoenl9hcd4p4g1',
  deviceTags: 'mvrow0le5anxvcc',
};

const PORTFOLIO_DOC_PATH = '/docs/portfolio/Moko-Beacon-Product-Summary_V3.4_20251223.pdf';
const L01_DOC_PATH = '/docs/anchors/l01a/L01-Wayfinding-Anchor-Brief.pdf';
const H2_DOC_PATH = '/docs/tags/h2/H2H2A-Product-Brief-_V2.0.pdf';
const H6_DOC_PATH = '/docs/tags/h6/H6-Light-sensor-Beacon-Product-Brief-V1.0_21080701.pdf';

const SPEC_UPDATES = [
  {
    workbookModel: 'B1',
    deviceKey: 'tag_b1_panic_button',
    patch: {
      bluetooth_version: 'BLE 4.2/5.0',
      ip_rating: 'IP66',
      battery_capacity: '500mAh',
      replaceable_battery: false,
      battery_life_estimate: '9 months',
      dimensions: '73.1 x 40.6 x 16.9 mm',
      power_supply: '500mAh rechargeable battery',
    },
  },
  {
    workbookModel: 'B2',
    deviceKey: 'tag_b2_smart_badge',
    patch: {
      bluetooth_version: 'BLE 5.0',
      ip_rating: 'IP66',
      battery_capacity: '800mAh',
      replaceable_battery: false,
      battery_life_estimate: '4 years',
      dimensions: '98.0 x 65.2 x 8.5 mm',
      weight: '35g',
      power_supply: '800mAh built-in battery',
    },
  },
  {
    workbookModel: 'B3',
    deviceKey: 'tag_b3_emergency_button',
    patch: {
      bluetooth_version: 'BLE 5.0',
      battery_capacity: '600mAh',
      replaceable_battery: true,
      battery_life_estimate: '3.5 years',
      dimensions: '48.0 x 48.0 x 15.3 mm',
      weight: '20g',
      power_supply: '600mAh replaceable battery',
    },
  },
  {
    workbookModel: 'B5',
    deviceKey: 'tag_b5_rechargeable_badge',
    patch: {
      bluetooth_version: 'BLE 5.0',
      ip_rating: 'IP66',
      battery_capacity: '350mAh',
      replaceable_battery: false,
      battery_life_estimate: '15 months',
      dimensions: '91.0 x 59.0 x 7.5 mm',
      weight: '32g',
      power_supply: '350mAh rechargeable battery',
    },
  },
  {
    workbookModel: 'H1',
    deviceKey: 'tag_h1_keychain',
    patch: {
      bluetooth_version: 'BLE 5.0',
      ip_rating: 'IP65',
      battery_capacity: '240mAh',
      replaceable_battery: true,
      battery_life_estimate: '1.5 years',
      dimensions: '32.5 x 32.5 x 7.0 mm',
      weight: '7.8g',
      power_supply: '240mAh replaceable battery',
    },
  },
  {
    workbookModel: 'H3',
    deviceKey: 'tag_h3_card',
    patch: {
      bluetooth_version: 'BLE 5.0',
      ip_rating: 'IP66',
      battery_capacity: '800mAh',
      replaceable_battery: false,
      battery_life_estimate: '5 years',
      dimensions: '85.6 x 54.1 x 5.2 mm',
      weight: '20g',
      power_supply: '800mAh sealed battery',
    },
  },
  {
    workbookModel: 'H3P',
    deviceKey: 'tag_h3_pro_button',
    aliasOf: 'H3 Pro',
    patch: {
      bluetooth_version: 'BLE 5.0',
      ip_rating: 'IP66',
      battery_capacity: '800mAh',
      replaceable_battery: false,
      battery_life_estimate: '5 years',
      dimensions: '85.6 x 54.2 x 5.2 mm',
      weight: '20g',
      power_supply: '800mAh sealed battery',
    },
  },
  {
    workbookModel: 'H4P',
    deviceKey: 'beacon_h4_pro_temp_humidity_sensor',
    aliasOf: 'H4 Pro',
    patch: {
      bluetooth_version: 'BLE 5.1',
      ip_rating: 'IPX4',
      battery_capacity: '1200mAh',
      replaceable_battery: true,
      battery_life_estimate: '5 years',
      dimensions: '88.0 x 32.2 x 18.2 mm',
      power_supply: '1200mAh replaceable battery',
    },
  },
  {
    workbookModel: 'H5P',
    deviceKey: 'tag_h5_pro_rfid_badge',
    aliasOf: 'H5 Pro',
    patch: {
      bluetooth_version: 'BLE 5.0',
      ip_rating: 'IP66',
      battery_capacity: '550mAh',
      replaceable_battery: true,
      battery_life_estimate: '3 years',
      dimensions: '68.0 x 50.0 x 6.3 mm',
      weight: '25g',
      power_supply: '550mAh replaceable battery',
    },
  },
  {
    workbookModel: 'L01A',
    deviceKey: 'anchor_l01a',
    patch: {
      bluetooth_version: 'BLE 5.1',
      ip_rating: 'IP67',
      battery_capacity: '2400mAh',
      replaceable_battery: true,
      battery_life_estimate: '8 years @ 0.2Hz',
      dimensions: '54.5 x 54.5 x 24.0 mm',
      power_supply: '2400mAh replaceable battery',
    },
  },
  {
    workbookModel: 'L03BH',
    deviceKey: 'anchor_l03',
    aliasOf: 'L03',
    patch: {
      bluetooth_version: 'BLE 5.1',
      ip_rating: 'IP67',
      battery_capacity: '10400mAh',
      battery_life_estimate: '10 years',
      dimensions: '74.0 x 74.0 x 23.0 mm',
      power_supply: '10400mAh battery',
    },
  },
  {
    workbookModel: 'L04H',
    deviceKey: 'anchor_l04',
    aliasOf: 'L04',
    patch: {
      bluetooth_version: 'BLE 5.1',
      battery_capacity: '5200mAh',
      battery_life_estimate: '10 years',
      dimensions: '73.8 x 46.3 x 26.5 mm',
      power_supply: '5200mAh battery',
    },
  },
  {
    workbookModel: 'L05E',
    deviceKey: 'beacon_l05_usb_beacon',
    aliasOf: 'L05',
    patch: {
      dimensions: '43.0 x 24.7 x 11.4 mm',
      weight: '10.1g',
      power_supply: 'USB power',
      battery_life_estimate: 'USB powered',
    },
  },
  {
    workbookModel: 'L02S',
    deviceKey: 'beacon_l02s_multiple_sensor',
    patch: {
      bluetooth_version: 'BLE 5.0',
      ip_rating: 'IP67',
      battery_capacity: '1000mAh',
      replaceable_battery: true,
      battery_life_estimate: '8 years @ 0.2Hz',
      dimensions: '69.9 x 46.7 x 18.0 mm',
      power_supply: '1000mAh replaceable battery',
      sensors: '3-axis accelerometer,barometric pressure sensor,humidity sensor,temperature sensor',
    },
  },
  {
    workbookModel: 'M1P',
    deviceKey: 'tag_m1p_led_tag',
    patch: {
      bluetooth_version: 'BLE 5.1',
      battery_capacity: '220mAh',
      replaceable_battery: true,
      battery_life_estimate: '9 months',
      dimensions: '30.0 x 30.0 x 8.0 mm',
      weight: '6.2g',
      power_supply: '220mAh replaceable battery',
    },
  },
  {
    workbookModel: 'M2',
    deviceKey: 'tag_m2_multi_variant_tag',
    patch: {
      bluetooth_version: 'BLE 5.1/BLE 4.2',
      ip_rating: 'IP67',
      battery_capacity: '1000mAh',
      replaceable_battery: true,
      battery_life_estimate: '3 years',
      dimensions: '70.0 x 46.0 x 21.0 mm',
      weight: '33.5g',
      power_supply: '1000mAh replaceable battery',
    },
  },
];

const DEVICE_CREATIONS = [
  {
    workbookModel: 'H5',
    deviceKey: 'tag_h5_personnel_badge',
    title: 'H5 Personnel Badge',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'personnel badge',
    description: 'Slim BLE personnel badge with RFID support and accelerometer sensing for staff identification and tracking workflows.',
    datasheetPath: PORTFOLIO_DOC_PATH,
    vendorProductUrl: '',
    applications: ['Personnel Tracking'],
    tagNames: [],
    protocolDetails: 'BLE personnel badge broadcasting and staff-tracking telemetry.',
    connectivityDetails: 'BLE wearable personnel badge',
    specs: {
      bluetooth_version: 'BLE 4.2/5.0',
      ip_rating: 'IP66',
      battery_capacity: '550mAh',
      replaceable_battery: true,
      battery_life_estimate: '3 years',
      dimensions: '65.4 x 43.0 x 5.7 mm',
      weight: '17.8g',
      power_supply: '550mAh replaceable battery',
      sensors: '3-axis accelerometer',
    },
  },
  {
    workbookModel: 'H2',
    deviceKey: 'tag_h2_navigator',
    title: 'H2 Navigator',
    category: 'tag',
    subcategory: 'Navigation Tag',
    role: 'navigator tag',
    description: 'Circular BLE navigator tag for indoor wayfinding, RTLS, and asset location tracking with IP65 protection and replaceable high-capacity battery.',
    datasheetPath: H2_DOC_PATH,
    vendorProductUrl: '',
    applications: ['Indoor Navigation', 'Asset Tracking'],
    tagNames: [],
    protocolDetails: 'BLE navigator beacon supporting iBeacon, Eddystone, and BeaconX Pro sensor data.',
    connectivityDetails: 'BLE navigation tag',
    specs: {
      bluetooth_version: 'BLE 5.0',
      ip_rating: 'IP65',
      battery_capacity: '1000mAh',
      replaceable_battery: true,
      battery_life_estimate: '5 years',
      dimensions: '48.5 x 48.0 x 14.7 mm',
      weight: '24g',
      power_supply: 'Replaceable CR2477 lithium coin cell battery | 1000mAh',
      installation: 'Hang / neck chain / sticker',
      material: 'ABS+PC & TPU',
      sensors: '3-axis accelerometer',
    },
  },
  {
    workbookModel: 'H6',
    deviceKey: 'beacon_h6_light_sensor_beacon',
    title: 'H6 Light Sensor Beacon',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'light sensor beacon',
    description: 'Slim BLE light sensor beacon for anti-dismantling alarm, asset tracking, proximity promotion, and ambient light monitoring.',
    datasheetPath: H6_DOC_PATH,
    vendorProductUrl: '',
    applications: ['Asset Tracking', 'Condition Monitoring'],
    tagNames: ['sensor'],
    protocolDetails: 'BLE light sensor beacon supporting iBeacon, Eddystone, BeaconX Pro sensor data, and button-trigger emergency states.',
    connectivityDetails: 'BLE light sensor tag',
    specs: {
      bluetooth_version: 'BLE 4.2 (hardware compatible with Bluetooth 5)',
      ip_rating: 'IP65',
      battery_capacity: '220mAh',
      replaceable_battery: true,
      battery_life_estimate: '12 months',
      dimensions: '51.0 x 24.5 x 5.5 mm',
      power_supply: 'CR2032 lithium coin cell battery | 220mAh',
      installation: 'Sticker / lanyard / neckchain',
      material: 'ABS',
      sensors: '3-axis accelerometer',
    },
  },
  {
    workbookModel: 'L01',
    deviceKey: 'anchor_l01',
    title: 'L01 Location Anchor',
    category: 'anchor',
    subcategory: 'BLE location anchor',
    role: 'positioning infrastructure',
    description: 'Battery-powered BLE location anchor for indoor wayfinding and warehouse positioning deployments.',
    datasheetPath: L01_DOC_PATH,
    vendorProductUrl: 'https://www.mokosmart.com/l01-l01a-wayfinding-tag/',
    applications: ['Indoor Navigation'],
    tagNames: ['anchor'],
    protocolDetails: 'BLE anchor broadcasting for indoor positioning infrastructure.',
    connectivityDetails: 'BLE battery-powered anchor',
    specs: {
      bluetooth_version: 'BLE 5.1',
      ip_rating: 'IP67',
      battery_capacity: '2400mAh',
      replaceable_battery: true,
      battery_life_estimate: '8 years @ 0.2Hz',
      dimensions: '76.2 x 53.6 x 24.0 mm',
      power_supply: '2400mAh replaceable battery',
      sensors: '3-axis accelerometer,humidity sensor,temperature sensor',
    },
  },
  {
    workbookModel: 'L01S',
    deviceKey: 'anchor_l01s',
    title: 'L01S Multi-Sensor Anchor',
    category: 'anchor',
    subcategory: 'BLE sensor anchor',
    role: 'positioning infrastructure',
    description: 'Battery-powered BLE anchor with temperature, humidity, barometric pressure, and motion sensing for positioning plus environmental awareness.',
    datasheetPath: PORTFOLIO_DOC_PATH,
    vendorProductUrl: 'https://www.mokosmart.com/l01-l01a-wayfinding-tag/',
    applications: ['Indoor Navigation', 'Environmental Monitoring'],
    tagNames: ['anchor', 'sensor'],
    protocolDetails: 'BLE anchor broadcasting with integrated environmental sensing.',
    connectivityDetails: 'BLE battery-powered sensor anchor',
    specs: {
      bluetooth_version: 'BLE 5.1',
      ip_rating: 'IP67',
      battery_capacity: '2400mAh',
      replaceable_battery: true,
      battery_life_estimate: '8 years @ 0.2Hz',
      dimensions: '76.2 x 53.6 x 24.0 mm',
      power_supply: '2400mAh replaceable battery',
      sensors: '3-axis accelerometer,barometric pressure sensor,humidity sensor,temperature sensor',
    },
  },
  {
    workbookModel: 'L02',
    deviceKey: 'anchor_l02',
    title: 'L02 Location Anchor',
    category: 'anchor',
    subcategory: 'BLE location anchor',
    role: 'positioning infrastructure',
    description: 'Compact BLE location anchor with temperature, humidity, and motion sensing for indoor positioning deployments.',
    datasheetPath: PORTFOLIO_DOC_PATH,
    vendorProductUrl: '',
    applications: ['Indoor Navigation'],
    tagNames: ['anchor'],
    protocolDetails: 'BLE anchor broadcasting for compact indoor positioning infrastructure.',
    connectivityDetails: 'BLE battery-powered anchor',
    specs: {
      bluetooth_version: 'BLE 5.0',
      ip_rating: 'IP67',
      battery_capacity: '1000mAh',
      replaceable_battery: true,
      battery_life_estimate: '8 years @ 0.2Hz',
      dimensions: '69.9 x 46.7 x 18.0 mm',
      power_supply: '1000mAh replaceable battery',
      sensors: '3-axis accelerometer,humidity sensor,temperature sensor',
    },
  },
];

const INVENTORY_VALIDATION = [
  {
    source: 'tags (2).json',
    item: 'T1',
    mac: 'FC0E55CBCC75',
    workbookModel: 'H3',
    deviceKey: 'tag_h3_card',
    status: 'matched_existing',
  },
  {
    source: 'tags (2).json',
    item: 'T2',
    mac: 'F47F5BCC9FED',
    workbookModel: 'M2',
    deviceKey: 'tag_m2_multi_variant_tag',
    status: 'matched_existing',
  },
  {
    source: 'tags (2).json',
    item: 'T3',
    mac: 'CAC90C39716B',
    workbookModel: 'B2',
    deviceKey: 'tag_b2_smart_badge',
    status: 'matched_existing',
  },
  {
    source: 'devices.json',
    item: 'B1',
    mac: 'fa9d445c7902',
    workbookModel: 'L01',
    deviceKey: 'anchor_l01',
    status: 'matched_created',
  },
  {
    source: 'devices.json',
    item: 'B2',
    mac: 'e5022a5f2b7c',
    workbookModel: 'L01A',
    deviceKey: 'anchor_l01a',
    status: 'matched_existing',
  },
  {
    source: 'devices.json',
    item: 'B3',
    mac: 'ca7995a4a2d1',
    workbookModel: 'L01A',
    deviceKey: 'anchor_l01a',
    status: 'matched_existing',
  },
  {
    source: 'devices.json',
    item: 'B4',
    mac: 'd16d0dd3da05',
    workbookModel: 'L01',
    deviceKey: 'anchor_l01',
    status: 'matched_created',
  },
];

const ALIAS_MAPPINGS = [
  { workbookModel: 'H3P', mapsTo: 'H3 Pro', deviceKey: 'tag_h3_pro_button' },
  { workbookModel: 'H4P', mapsTo: 'H4 Pro', deviceKey: 'beacon_h4_pro_temp_humidity_sensor' },
  { workbookModel: 'H5P', mapsTo: 'H5 Pro', deviceKey: 'tag_h5_pro_rfid_badge' },
  { workbookModel: 'L03BH', mapsTo: 'L03', deviceKey: 'anchor_l03' },
  { workbookModel: 'L04H', mapsTo: 'L04', deviceKey: 'anchor_l04' },
  { workbookModel: 'L05E', mapsTo: 'L05', deviceKey: 'beacon_l05_usb_beacon' },
  { workbookModel: 'M4P', mapsTo: 'M4 Pro', deviceKey: 'tag_m4_pro_waterproof_tag' },
  { workbookModel: 'M6H', mapsTo: 'M6', deviceKey: 'tag_m6_industry_tag' },
  { workbookModel: 'W3P', mapsTo: 'W3 Pro', deviceKey: 'tag_w3_pro_smart_guard_wristband' },
];

const UNRESOLVED_MODELS = [];

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

async function createRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'POST',
    body: JSON.stringify(records),
  });
}

async function patchRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'PATCH',
    body: JSON.stringify(records),
  });
}

async function deleteRecords(baseUrl, token, tableId, records) {
  return apiFetch(`${baseUrl}/api/v2/tables/${tableId}/records`, token, {
    method: 'DELETE',
    body: JSON.stringify(records),
  });
}

function getRowString(row, key) {
  return typeof row?.[key] === 'string' ? row[key] : '';
}

function getRowNumber(row, key) {
  return typeof row?.[key] === 'number' ? row[key] : undefined;
}

function boolOrFallback(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Boolean(value);
  return fallback;
}

function pickString(nextValue, currentValue = '') {
  return typeof nextValue === 'string' && nextValue.trim() ? nextValue.trim() : currentValue;
}

async function upsertDevice(baseUrl, token, devicesRows, payload) {
  const existing = devicesRows.find((row) => getRowString(row, 'device_key') === payload.device_key);
  if (existing) {
    if (APPLY) {
      await patchRecords(baseUrl, token, TABLE_IDS.devices, [{ Id: existing.Id, ...payload }]);
    }
    return { ...existing, ...payload };
  }

  if (!APPLY) return { Id: -1, ...payload };

  const createdResponse = await createRecords(baseUrl, token, TABLE_IDS.devices, [payload]);
  const created = Array.isArray(createdResponse) ? createdResponse[0] : createdResponse;
  devicesRows.push(created);
  return created;
}

async function upsertSpecs(baseUrl, token, specsRows, payload) {
  const existing = specsRows.find((row) => getRowString(row, 'device_key') === payload.device_key);
  if (existing) {
    if (APPLY) {
      await patchRecords(baseUrl, token, TABLE_IDS.deviceSpecs, [{ Id: existing.Id, ...payload }]);
    }
    const merged = { ...existing, ...payload };
    const index = specsRows.findIndex((row) => row.Id === existing.Id);
    if (index >= 0) specsRows[index] = merged;
    return merged;
  }

  if (!APPLY) {
    const prepared = { Id: -1, ...payload };
    specsRows.push(prepared);
    return prepared;
  }

  const createdResponse = await createRecords(baseUrl, token, TABLE_IDS.deviceSpecs, [payload]);
  const created = Array.isArray(createdResponse) ? createdResponse[0] : createdResponse;
  specsRows.push(created);
  return created;
}

async function replaceJoinRows(baseUrl, token, tableId, existingRows, nextRows) {
  if (existingRows.length && APPLY) {
    await deleteRecords(
      baseUrl,
      token,
      tableId,
      existingRows.map((row) => ({ Id: row.Id })),
    );
  }

  if (nextRows.length && APPLY) {
    await createRecords(baseUrl, token, tableId, nextRows);
  }
}

function buildPatchedSpecs(currentRow, patch, deviceKey, deviceId) {
  const {
    Id,
    CreatedAt,
    UpdatedAt,
    device_ref,
    ...rest
  } = currentRow ?? {};

  return {
    ...rest,
    title: getRowString(currentRow, 'title') || deviceKey,
    device_key: deviceKey,
    nc_24rw___devices_id: deviceId ?? getRowNumber(currentRow, 'nc_24rw___devices_id'),
    bluetooth_version: pickString(patch.bluetooth_version, getRowString(currentRow, 'bluetooth_version')),
    battery_capacity: pickString(patch.battery_capacity, getRowString(currentRow, 'battery_capacity')),
    replaceable_battery: patch.replaceable_battery ?? boolOrFallback(currentRow?.replaceable_battery, false),
    ip_rating: pickString(patch.ip_rating, getRowString(currentRow, 'ip_rating')),
    dimensions: pickString(patch.dimensions, getRowString(currentRow, 'dimensions')),
    weight: pickString(patch.weight, getRowString(currentRow, 'weight')),
    power_supply: pickString(patch.power_supply, getRowString(currentRow, 'power_supply')),
    battery_life_estimate: pickString(patch.battery_life_estimate, getRowString(currentRow, 'battery_life_estimate')),
    sensors: pickString(patch.sensors, getRowString(currentRow, 'sensors')),
  };
}

async function main() {
  const { baseUrl, token } = await loadConfig();
  const [
    devicesRows,
    specsRows,
    protocolsRows,
    connectivityRows,
    applicationsRows,
    businessTagsRows,
    deviceProtocolRows,
    deviceConnectivityRows,
    deviceApplicationRows,
    deviceTagRows,
  ] = await Promise.all([
    fetchAll(baseUrl, token, TABLE_IDS.devices),
    fetchAll(baseUrl, token, TABLE_IDS.deviceSpecs),
    fetchAll(baseUrl, token, TABLE_IDS.protocols),
    fetchAll(baseUrl, token, TABLE_IDS.connectivityOptions),
    fetchAll(baseUrl, token, TABLE_IDS.applications),
    fetchAll(baseUrl, token, TABLE_IDS.businessTags),
    fetchAll(baseUrl, token, TABLE_IDS.deviceProtocols),
    fetchAll(baseUrl, token, TABLE_IDS.deviceConnectivity),
    fetchAll(baseUrl, token, TABLE_IDS.deviceApplications),
    fetchAll(baseUrl, token, TABLE_IDS.deviceTags),
  ]);

  const protocolBle = protocolsRows.find((row) => getRowString(row, 'protocol_key') === 'proto_ble');
  const connectivityBle = connectivityRows.find((row) => getRowString(row, 'connectivity_key') === 'conn_ble');
  if (!protocolBle || !connectivityBle) {
    throw new Error('Required BLE protocol/connectivity options are missing.');
  }

  const applicationByName = new Map(applicationsRows.map((row) => [getRowString(row, 'application_name'), row]));
  const tagByName = new Map(businessTagsRows.map((row) => [getRowString(row, 'tag_name'), row]));

  const updated = [];
  const created = [];
  const skipped = [];

  for (const update of SPEC_UPDATES) {
    const deviceRow = devicesRows.find((row) => getRowString(row, 'device_key') === update.deviceKey);
    if (!deviceRow) {
      skipped.push({
        workbookModel: update.workbookModel,
        deviceKey: update.deviceKey,
        reason: 'Target device row not found in live catalog.',
      });
      continue;
    }

    const currentSpecs = specsRows.find((row) => getRowString(row, 'device_key') === update.deviceKey) ?? {};
    const deviceId = getRowNumber(deviceRow, 'Id');
    const nextSpecs = buildPatchedSpecs(currentSpecs, update.patch, update.deviceKey, deviceId);
    await upsertSpecs(baseUrl, token, specsRows, nextSpecs);

    updated.push({
      workbookModel: update.workbookModel,
      aliasOf: update.aliasOf ?? null,
      deviceKey: update.deviceKey,
      action: 'updated_specs',
    });
  }

  for (const device of DEVICE_CREATIONS) {
    const existingDevice = devicesRows.find((row) => getRowString(row, 'device_key') === device.deviceKey);
    const devicePayload = {
      title: device.title,
      device_key: device.deviceKey,
      device_name: device.title,
      manufacturer: 'MOKO SMART',
      model_number: device.workbookModel,
      category: device.category,
      subcategory: device.subcategory,
      role: device.role,
      description: device.description,
      datasheet_path: device.datasheetPath,
      vendor_product_url: device.vendorProductUrl,
      status: 'active',
    };

    const deviceRow = await upsertDevice(baseUrl, token, devicesRows, devicePayload);
    const deviceId = getRowNumber(deviceRow, 'Id');
    const currentSpecs = specsRows.find((row) => getRowString(row, 'device_key') === device.deviceKey) ?? {};
    const {
      Id,
      CreatedAt,
      UpdatedAt,
      device_ref,
      ...existingSpecFields
    } = currentSpecs;
    const nextSpecs = {
      ...existingSpecFields,
      title: device.deviceKey,
      device_key: device.deviceKey,
      nc_24rw___devices_id: deviceId ?? getRowNumber(currentSpecs, 'nc_24rw___devices_id'),
      wifi_support: boolOrFallback(currentSpecs?.wifi_support, false),
      wifi_band: getRowString(currentSpecs, 'wifi_band'),
      ethernet_support: boolOrFallback(currentSpecs?.ethernet_support, false),
      poe_support: boolOrFallback(currentSpecs?.poe_support, false),
      poe_standard: getRowString(currentSpecs, 'poe_standard'),
      rj45_support: boolOrFallback(currentSpecs?.rj45_support, false),
      cellular_support: boolOrFallback(currentSpecs?.cellular_support, false),
      cellular_type: getRowString(currentSpecs, 'cellular_type'),
      gnss_support: boolOrFallback(currentSpecs?.gnss_support, false),
      lte_support: boolOrFallback(currentSpecs?.lte_support, false),
      lte_category: getRowString(currentSpecs, 'lte_category'),
      manual_path: getRowString(currentSpecs, 'manual_path') || device.datasheetPath,
      backhaul_type: getRowString(currentSpecs, 'backhaul_type') || 'None (BLE broadcast / scanned by anchors, gateways, or mobile apps)',
      ...device.specs,
    };
    await upsertSpecs(baseUrl, token, specsRows, nextSpecs);

    const existingProtocolRows = deviceProtocolRows.filter((row) => getRowString(row, 'device_key') === device.deviceKey);
    const existingConnectivityRows = deviceConnectivityRows.filter((row) => getRowString(row, 'device_key') === device.deviceKey);
    const existingApplicationRows = deviceApplicationRows.filter((row) => getRowString(row, 'device_key') === device.deviceKey);
    const existingTagRows = deviceTagRows.filter((row) => getRowString(row, 'device_key') === device.deviceKey);

    await replaceJoinRows(baseUrl, token, TABLE_IDS.deviceProtocols, existingProtocolRows, [
      {
        title: `${device.deviceKey} | proto_ble | broadcast`,
        device_key: device.deviceKey,
        protocol_key: 'proto_ble',
        direction: 'broadcast',
        details: device.protocolDetails,
        nc_24rw___devices_id: deviceId,
        nc_24rw___protocols_id: protocolBle.Id,
      },
    ]);

    await replaceJoinRows(baseUrl, token, TABLE_IDS.deviceConnectivity, existingConnectivityRows, [
      {
        title: `${device.deviceKey} | conn_ble`,
        device_key: device.deviceKey,
        connectivity_key: 'conn_ble',
        details: device.connectivityDetails,
        nc_24rw___devices_id: deviceId,
        nc_24rw___connectivity_options_id: connectivityBle.Id,
      },
    ]);

    await replaceJoinRows(
      baseUrl,
      token,
      TABLE_IDS.deviceApplications,
      existingApplicationRows,
      device.applications
        .map((applicationName) => applicationByName.get(applicationName))
        .filter(Boolean)
        .map((applicationRow) => ({
          title: `${device.deviceKey} | ${getRowString(applicationRow, 'application_key')}`,
          device_key: device.deviceKey,
          application_key: getRowString(applicationRow, 'application_key'),
          nc_24rw___devices_id: deviceId,
          nc_24rw___applications_id: applicationRow.Id,
        })),
    );

    await replaceJoinRows(
      baseUrl,
      token,
      TABLE_IDS.deviceTags,
      existingTagRows,
      device.tagNames
        .map((tagName) => tagByName.get(tagName))
        .filter(Boolean)
        .map((tagRow) => ({
          title: `${device.deviceKey} | ${getRowString(tagRow, 'tag_key')}`,
          device_key: device.deviceKey,
          tag_key: getRowString(tagRow, 'tag_key'),
          nc_24rw___devices_id: deviceId,
          nc_24rw___business_tags_id: tagRow.Id,
        })),
    );

    created.push({
      workbookModel: device.workbookModel,
      deviceKey: device.deviceKey,
      action: existingDevice ? 'updated_or_relinked' : 'created_device',
    });
  }

  const audit = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    sourceWorkbook: 'C:\\Users\\Anshaj\\Downloads\\Moko Beacons list.xlsx',
    sourceInventoryFiles: [
      'C:\\Users\\Anshaj\\Downloads\\tags (2).json',
      'C:\\Users\\Anshaj\\Documents\\RSSI_Location_Engine\\devices.json',
      'C:\\Users\\Anshaj\\Downloads\\anchor (1).json',
    ],
    validatedInventoryMatches: INVENTORY_VALIDATION,
    aliasMappings: ALIAS_MAPPINGS,
    updated,
    created,
    unresolvedModels: UNRESOLVED_MODELS,
    skipped,
  };

  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  await fs.writeFile(AUDIT_PATH, JSON.stringify(audit, null, 2), 'utf8');

  console.log(`${APPLY ? 'Applied' : 'Prepared'} MOKO inventory workbook reconciliation.`);
  console.log(`Updated specs: ${updated.length}`);
  console.log(`Created or refreshed devices: ${created.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Audit written to: ${AUDIT_PATH}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
