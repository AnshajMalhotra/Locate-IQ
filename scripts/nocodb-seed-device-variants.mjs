import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');
const APPLY = process.argv.includes('--apply');

const DEVICE = {
  title: 'M2 Multi-Variant Tag',
  device_key: 'beacon_m2_multi_variant_tag',
  device_name: 'M2 Tag',
  manufacturer: 'MOKO SMART',
  model_number: 'M2',
  category: 'beacon',
  subcategory: 'BLE RTLS asset tag',
  role: 'tag / beacon',
  description: 'BLE tag family with multiple chipset variants that support different positioning modes, firmware tracks, and sensor combinations.',
  datasheet_path: '',
  status: 'active',
  vendor_product_url: 'https://www.mokosmart.com/',
  variant_group: 'M2 Tag Family',
};

const DEVICE_SPEC = {
  title: 'beacon_m2_multi_variant_tag',
  device_key: 'beacon_m2_multi_variant_tag',
  bluetooth_version: 'BLE 5.1+',
  wifi_support: false,
  wifi_band: '',
  ethernet_support: false,
  poe_support: false,
  poe_standard: '',
  cellular_support: false,
  cellular_type: '',
  gnss_support: false,
  battery_capacity: 'Coin cell / SKU dependent',
  replaceable_battery: false,
  ip_rating: 'IP67',
  operating_temp_min_c: null,
  operating_temp_max_c: null,
  dimensions: '',
  weight: '',
  power_supply: '',
  installation: 'Portable tag / badge / asset mount',
  material: '',
  rj45_support: false,
  poe_mode: 'Not supported',
  backhaul_type: 'BLE',
  lte_support: false,
  lte_category: '',
  indoor_outdoor_rating: 'Indoor RTLS tag family',
  mounting_options_normalized: 'Portable tag / badge / asset mount',
  max_signal_range_open_space: 'Variant dependent',
  max_signal_range_real_world: 'Depends on antenna design, layout, and positioning mode.',
};

const DEVICE_CONNECTIVITY = [
  {
    title: 'beacon_m2_multi_variant_tag | conn_ble',
    device_key: 'beacon_m2_multi_variant_tag',
    connectivity_key: 'conn_ble',
    details: 'BLE',
  },
];

const DEVICE_PROTOCOLS = [
  {
    title: 'beacon_m2_multi_variant_tag | proto_ble | broadcast',
    device_key: 'beacon_m2_multi_variant_tag',
    protocol_key: 'proto_ble',
    direction: 'broadcast',
    details: 'BLE advertising tag family',
  },
];

const DEVICE_TAGS = [
  {
    title: 'beacon_m2_multi_variant_tag | tag_beacon',
    device_key: 'beacon_m2_multi_variant_tag',
    tag_key: 'tag_beacon',
  },
];

const VARIANTS = [
  {
    title: 'M2 (Nordic 52810)',
    variant_key: 'm2_nordic_52810',
    device_key: 'beacon_m2_multi_variant_tag',
    variant_label: 'M2 (Nordic 52810)',
    chipset: 'Nordic 52810',
    work_modes: 'BLE AoA\nBLE RSSI',
    firmware_summary: 'BLE firmware AoA: BXP-A-C\nBLE firmware RSSI: BXP-D',
    sensors: '3-axis accelerometer',
    other_notes: 'Standard variant for BLE AoA tag',
    sort_order: 1,
  },
  {
    title: 'M2 (Nordic 52805)',
    variant_key: 'm2_nordic_52805',
    device_key: 'beacon_m2_multi_variant_tag',
    variant_label: 'M2 (Nordic 52805)',
    chipset: 'Nordic 52805',
    work_modes: 'BLE AoA\nBLE RSSI',
    firmware_summary: 'BLE firmware AoA: BXP-A-C\nBLE firmware RSSI: BXP-DH',
    sensors: '3-axis accelerometer',
    other_notes: '',
    sort_order: 2,
  },
  {
    title: 'M2 (Nordic 52832)',
    variant_key: 'm2_nordic_52832',
    device_key: 'beacon_m2_multi_variant_tag',
    variant_label: 'M2 (Nordic 52832)',
    chipset: 'Nordic 52832',
    work_modes: 'BLE RSSI',
    firmware_summary: '',
    sensors: '3-axis accelerometer\ntemperature',
    other_notes: '',
    sort_order: 3,
  },
  {
    title: 'M2 (EFR32BG22)',
    variant_key: 'm2_efr32bg22',
    device_key: 'beacon_m2_multi_variant_tag',
    variant_label: 'M2 (EFR32BG22)',
    chipset: 'EFR32BG22',
    work_modes: 'BLE AoA (for quuppa)',
    firmware_summary: 'BLE firmware: quuppa v3',
    sensors: '',
    other_notes: 'Variant for BLE AoA',
    sort_order: 4,
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

async function fetchAll(baseUrl, token, tableId) {
  const url = new URL(`${baseUrl}/api/v2/tables/${tableId}/records`);
  url.searchParams.set('limit', '200');
  const response = await apiFetch(url, token);
  return Array.isArray(response) ? response : response.list ?? response.data ?? [];
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

function getRowNumber(row, key) {
  const value = row?.[key];
  return typeof value === 'number' ? value : undefined;
}

function getRowString(row, key) {
  const value = row?.[key];
  return typeof value === 'string' ? value : '';
}

async function ensureDevice({ baseUrl, token, tables }) {
  const deviceRows = await fetchAll(baseUrl, token, tables.get('devices'));
  const existing = deviceRows.find((row) => getRowString(row, 'device_key') === DEVICE.device_key);

  if (!existing) {
    if (!APPLY) {
      console.log(`devices: would create ${DEVICE.device_key}`);
      return null;
    }

    const created = await createRecords(baseUrl, token, tables.get('devices'), [DEVICE]);
    const createdRow = Array.isArray(created) ? created[0] : created;
    console.log(`devices: created ${DEVICE.device_key}`);
    return createdRow;
  }

  const needsPatch =
    getRowString(existing, 'variant_group') !== DEVICE.variant_group ||
    getRowString(existing, 'vendor_product_url') !== DEVICE.vendor_product_url;

  if (!needsPatch) {
    console.log(`devices: ${DEVICE.device_key} already up to date`);
    return existing;
  }

  if (!APPLY) {
    console.log(`devices: would update ${DEVICE.device_key}`);
    return existing;
  }

  await patchRecords(baseUrl, token, tables.get('devices'), [
    {
      Id: getRowNumber(existing, 'Id'),
      variant_group: DEVICE.variant_group,
      vendor_product_url: DEVICE.vendor_product_url,
    },
  ]);

  const refreshedRows = await fetchAll(baseUrl, token, tables.get('devices'));
  const refreshed = refreshedRows.find((row) => getRowString(row, 'device_key') === DEVICE.device_key);
  console.log(`devices: updated ${DEVICE.device_key}`);
  return refreshed ?? existing;
}

async function ensureSingleChildRecord({ baseUrl, token, tableId, keyField, payload, label }) {
  const rows = await fetchAll(baseUrl, token, tableId);
  const existing = rows.find((row) => getRowString(row, keyField) === payload[keyField]);

  if (!existing) {
    if (!APPLY) {
      console.log(`${label}: would create ${payload[keyField]}`);
      return;
    }

    await createRecords(baseUrl, token, tableId, [payload]);
    console.log(`${label}: created ${payload[keyField]}`);
    return;
  }

  if (!APPLY) {
    console.log(`${label}: would update ${payload[keyField]}`);
    return;
  }

  await patchRecords(baseUrl, token, tableId, [{ Id: getRowNumber(existing, 'Id'), ...payload }]);
  console.log(`${label}: updated ${payload[keyField]}`);
}

async function ensureJoinRows({ baseUrl, token, tableId, keyField, rows, label }) {
  const existingRows = await fetchAll(baseUrl, token, tableId);
  const existingKeys = new Set(existingRows.map((row) => getRowString(row, keyField)));
  const missing = rows.filter((row) => !existingKeys.has(row[keyField]));

  if (!missing.length) {
    console.log(`${label}: no new rows needed`);
    return;
  }

  if (!APPLY) {
    console.log(`${label}: would create ${missing.length} row(s)`);
    return;
  }

  await createRecords(baseUrl, token, tableId, missing);
  console.log(`${label}: created ${missing.length} row(s)`);
}

async function ensureVariants({ baseUrl, token, tables, deviceId }) {
  const variantTableId = tables.get('device_variants');
  const existingVariants = await fetchAll(baseUrl, token, variantTableId);

  for (const variant of VARIANTS) {
    const existing = existingVariants.find((row) => getRowString(row, 'variant_key') === variant.variant_key);
    const payload = {
      title: variant.title,
      variant_key: variant.variant_key,
      device_key: variant.device_key,
      variant_label: variant.variant_label,
      chipset: variant.chipset,
      work_modes: variant.work_modes,
      firmware_summary: variant.firmware_summary,
      sensors: variant.sensors,
      other_notes: variant.other_notes,
      sort_order: variant.sort_order,
      nc_24rw___devices_id: deviceId,
    };

    if (!existing) {
      if (!APPLY) {
        console.log(`device_variants: would create ${variant.variant_key}`);
      } else {
        await createRecords(baseUrl, token, variantTableId, [payload]);
        console.log(`device_variants: created ${variant.variant_key}`);
      }
    } else if (APPLY) {
      await patchRecords(baseUrl, token, variantTableId, [{ Id: getRowNumber(existing, 'Id'), ...payload }]);
      console.log(`device_variants: updated ${variant.variant_key}`);
    } else {
      console.log(`device_variants: would update ${variant.variant_key}`);
    }
  }
}

async function main() {
  const { baseUrl, token, baseId } = await loadConfig();
  const tablesResponse = await apiFetch(`${baseUrl}/api/v2/meta/bases/${baseId}/tables`, token);
  const tables = new Map((tablesResponse.list ?? []).map((table) => [table.title, table.id]));

  const device = await ensureDevice({ baseUrl, token, tables });
  await ensureSingleChildRecord({
    baseUrl,
    token,
    tableId: tables.get('device_specs'),
    keyField: 'device_key',
    payload: DEVICE_SPEC,
    label: 'device_specs',
  });
  await ensureJoinRows({
    baseUrl,
    token,
    tableId: tables.get('device_connectivity'),
    keyField: 'title',
    rows: DEVICE_CONNECTIVITY,
    label: 'device_connectivity',
  });
  await ensureJoinRows({
    baseUrl,
    token,
    tableId: tables.get('device_protocols'),
    keyField: 'title',
    rows: DEVICE_PROTOCOLS,
    label: 'device_protocols',
  });
  await ensureJoinRows({
    baseUrl,
    token,
    tableId: tables.get('device_tags'),
    keyField: 'title',
    rows: DEVICE_TAGS,
    label: 'device_tags',
  });

  if (!device) {
    console.log('device_variants: would create variant rows after device creation');
    console.log('Dry run complete. Re-run with --apply to seed device variants.');
    return;
  }

  const deviceId = getRowNumber(device, 'Id');
  if (!deviceId) {
    throw new Error('Could not resolve device Id for M2 variant seeding.');
  }

  await ensureVariants({ baseUrl, token, tables, deviceId });

  console.log(APPLY ? 'Device variants seeded.' : 'Dry run complete. Re-run with --apply to seed device variants.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
