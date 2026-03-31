import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
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

const H4_DOC_PATH = '/docs/beacons/h4/H4-Series-Product-Brief_20250619.pdf';

const H4_DEVICES = [
  {
    key: 'beacon_h4_temp_humidity_sensor',
    title: 'H4 Temperature & Humidity Sensor',
    modelNumber: 'H4',
    category: 'beacon',
    subcategory: 'BLE temperature & humidity sensor',
    role: 'sensor beacon',
    description:
      'BLE 5.1 temperature and humidity sensor beacon for cold-chain traceability and environmental monitoring, with local logging, replaceable AA batteries, and optional accelerometer and barometric pressure sensing.',
    vendorProductUrl: 'https://www.mokosmart.com/mokosmart-h4-beacon-temperature-humidity-sensor-supporting-ble5-0/',
    datasheetPath: H4_DOC_PATH,
    status: 'active',
    specs: {
      bluetooth_version: 'BLE 5.1',
      sensors: 'temperature sensor,humidity sensor,accelerometer sensor,barometric pressure sensor',
      battery_life_estimate: '5 years',
      battery_capacity: '1200mAh | 2*AA replaceable battery',
      ip_rating: 'IPX4',
      power_supply: '1200mAh | 2*AA replaceable battery',
      dimensions: '70 x 32.2 x 18.2 mm',
      weight: '',
      material: 'ABS+PC & PMMA',
      installation: '',
      backhaul_type: 'BLE sensor telemetry via gateway / tracker uplink',
      operating_temp_min_c: -20,
      operating_temp_max_c: 60,
      manual_path: H4_DOC_PATH,
    },
    protocolDetails: 'Supports iBeacon, Eddystone (UID/URL/TLM), and MOKO BeaconX Pro sensor data.',
    applications: ['Environmental Monitoring', 'Logistics', 'Warehouse Tracking', 'Healthcare'],
    tags: ['beacon', 'sensor'],
  },
  {
    key: 'beacon_h4_pro_temp_humidity_sensor',
    title: 'H4 Pro Temperature & Humidity Sensor',
    modelNumber: 'H4 Pro',
    category: 'beacon',
    subcategory: 'BLE temperature & humidity sensor',
    role: 'sensor beacon',
    description:
      'High-precision Bluetooth LE temperature and humidity sensor beacon designed for environmental monitoring and analysis, with probe support, replaceable battery, and long-life local logging.',
    vendorProductUrl: 'https://store.mokosmart.com/product/h4-pro-temperature-humidity-sensor/',
    datasheetPath: H4_DOC_PATH,
    status: 'active',
    specs: {
      bluetooth_version: 'BLE 5.1',
      sensors: 'temperature sensor,humidity sensor,accelerometer sensor,barometric pressure sensor',
      battery_life_estimate: '5 years',
      battery_capacity: '1200mAh, replaceable',
      ip_rating: 'IPX4',
      power_supply: '1200mAh replaceable battery',
      dimensions: '88.0 x 32.2 x 18.2 mm | Probe: Phi 3 x 1000 mm',
      weight: '35.1g (with battery)',
      material: 'ABS+PC & PMMA',
      installation: '3M tape',
      backhaul_type: 'BLE sensor telemetry via gateway / tracker uplink',
      operating_temp_min_c: -20,
      operating_temp_max_c: 60,
      manual_path: H4_DOC_PATH,
    },
    protocolDetails: 'Supports iBeacon, Eddystone (UID/URL/TLM), and MOKO BeaconX Pro sensor data.',
    applications: ['Environmental Monitoring', 'Logistics', 'Warehouse Tracking', 'Healthcare'],
    tags: ['beacon', 'sensor'],
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

async function ensureLookupRow(baseUrl, token, tableId, rows, matchKey, matchValue, payload) {
  const existing = rows.find((row) => getRowString(row, matchKey) === matchValue);
  if (existing) return existing;
  if (!APPLY) return { Id: -1, ...payload };

  const createdResponse = await createRecords(baseUrl, token, tableId, [payload]);
  const created = Array.isArray(createdResponse) ? createdResponse[0] : createdResponse;
  rows.push(created);
  return created;
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
    return;
  }

  if (APPLY) {
    await createRecords(baseUrl, token, TABLE_IDS.deviceSpecs, [payload]);
  }
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

  const environmentalApp = await ensureLookupRow(
    baseUrl,
    token,
    TABLE_IDS.applications,
    applicationsRows,
    'application_key',
    'app_environmental_monitoring',
    {
      title: 'Environmental Monitoring',
      application_key: 'app_environmental_monitoring',
      application_name: 'Environmental Monitoring',
      description: 'Environmental monitoring and sensor telemetry use cases.',
    },
  );

  const sensorTag = await ensureLookupRow(
    baseUrl,
    token,
    TABLE_IDS.businessTags,
    businessTagsRows,
    'tag_key',
    'tag_sensor',
    {
      title: 'sensor',
      tag_key: 'tag_sensor',
      tag_name: 'sensor',
      description: 'Sensor-focused BLE device for telemetry and monitoring.',
    },
  );

  const applicationByName = new Map(applicationsRows.map((row) => [getRowString(row, 'application_name'), row]));
  applicationByName.set('Environmental Monitoring', environmentalApp);
  const tagByName = new Map(businessTagsRows.map((row) => [getRowString(row, 'tag_name'), row]));
  tagByName.set('sensor', sensorTag);

  const summary = [];

  for (const device of H4_DEVICES) {
    const devicePayload = {
      title: device.title,
      device_key: device.key,
      device_name: device.title,
      manufacturer: 'MOKO SMART',
      model_number: device.modelNumber,
      category: device.category,
      subcategory: device.subcategory,
      role: device.role,
      description: device.description,
      datasheet_path: device.datasheetPath,
      vendor_product_url: device.vendorProductUrl,
      status: device.status,
    };

    const deviceRow = await upsertDevice(baseUrl, token, devicesRows, devicePayload);
    const deviceId = getRowNumber(deviceRow, 'Id');

    await upsertSpecs(baseUrl, token, specsRows, {
      title: device.key,
      device_key: device.key,
      ...device.specs,
      wifi_support: false,
      wifi_band: '',
      ethernet_support: false,
      poe_support: false,
      poe_standard: '',
      rj45_support: false,
      cellular_support: false,
      cellular_type: '',
      gnss_support: false,
      lte_support: false,
      lte_category: '',
      replaceable_battery: true,
    });

    const existingProtocolRows = deviceProtocolRows.filter((row) => getRowString(row, 'device_key') === device.key);
    const existingConnectivityRows = deviceConnectivityRows.filter((row) => getRowString(row, 'device_key') === device.key);
    const existingApplicationRows = deviceApplicationRows.filter((row) => getRowString(row, 'device_key') === device.key);
    const existingTagRows = deviceTagRows.filter((row) => getRowString(row, 'device_key') === device.key);

    await replaceJoinRows(baseUrl, token, TABLE_IDS.deviceProtocols, existingProtocolRows, [
      {
        title: `${device.key} | proto_ble | broadcast`,
        device_key: device.key,
        protocol_key: 'proto_ble',
        direction: 'broadcast',
        details: device.protocolDetails,
        nc_24rw___devices_id: deviceId,
        nc_24rw___protocols_id: protocolBle.Id,
      },
    ]);

    await replaceJoinRows(baseUrl, token, TABLE_IDS.deviceConnectivity, existingConnectivityRows, [
      {
        title: `${device.key} | conn_ble`,
        device_key: device.key,
        connectivity_key: 'conn_ble',
        details: 'BLE sensor beacon',
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
          title: `${device.key} | ${getRowString(applicationRow, 'application_key')}`,
          device_key: device.key,
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
      device.tags
        .map((tagName) => tagByName.get(tagName))
        .filter(Boolean)
        .map((tagRow) => ({
          title: `${device.key} | ${getRowString(tagRow, 'tag_key')}`,
          device_key: device.key,
          tag_key: getRowString(tagRow, 'tag_key'),
          nc_24rw___devices_id: deviceId,
          nc_24rw___business_tags_id: tagRow.Id,
        })),
    );

    summary.push(`${device.title} (${device.key})`);
  }

  console.log(`${APPLY ? 'Seeded' : 'Prepared'} H4 series device records:`);
  for (const line of summary) console.log(`- ${line}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
