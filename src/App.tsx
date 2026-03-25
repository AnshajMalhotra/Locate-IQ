import { useCallback, useDeferredValue, useEffect, useState } from 'react';

import DeviceCard from './components/DeviceCard';
import CommandBar from './components/CommandBar';
import DeviceDetailPanel from './components/DeviceDetailPanel';
import FilterSidebar from './components/FilterSidebar';
import HardwareSearch from './components/HardwareSearch';
import Sidebar from './components/Sidebar';
import { Device, DeviceDocument, DeviceOption, DeviceProtocol, DeviceSavePayload, getDeviceUiCategory, getDeviceUiCategoryLabel, mockDevices } from './data/mockDevices';
import './App.css';

type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'failed';
type NocoRow = Record<string, unknown>;
type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

type FilterState = {
  categories: string[];
  manufacturers: string[];
  applications: string[];
  protocols: string[];
  connectivity: string[];
  tags: string[];
  batteryLife: string[];
  ipRatings: string[];
  edgeModes: string[];
  status: string[];
  requirePoe: boolean;
  requireEthernet: boolean;
  requireWifi: boolean;
  requireCellular: boolean;
  requireGnss: boolean;
  requireLocalCompute: boolean;
};

const defaultFilters: FilterState = {
  categories: [],
  manufacturers: [],
  applications: [],
  protocols: [],
  connectivity: [],
  tags: [],
  batteryLife: [],
  ipRatings: [],
  edgeModes: [],
  status: [],
  requirePoe: false,
  requireEthernet: false,
  requireWifi: false,
  requireCellular: false,
  requireGnss: false,
  requireLocalCompute: false,
};

const tableIds = {
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
  gatewayProfiles: 'momj1rwqmub764f',
  anchorProfiles: 'm2w2nv5ygb0nz0t',
  deviceVariants: 'msmzgfblv22rlkh',
};

const MERGED_WIRED_CONNECTIVITY_KEY = 'conn_ethernet_poe';
const MERGED_WIRED_CONNECTIVITY_LABEL = 'Ethernet / PoE';

function uniqueSorted(values: Array<string | undefined | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim()))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function getLinkedId(value: unknown) {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === 'object' && 'Id' in first) {
      return String((first as { Id: string | number }).Id);
    }
  }

  if (value && typeof value === 'object' && 'Id' in value) {
    return String((value as { Id: string | number }).Id);
  }

  return null;
}

function getLinkedTitle(value: unknown) {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === 'object' && 'title' in first) {
      return String((first as { title: string }).title);
    }
  }

  if (value && typeof value === 'object' && 'title' in value) {
    return String((value as { title: string }).title);
  }

  return null;
}

function getRowString(row: NocoRow, key: string) {
  const value = row[key];
  return typeof value === 'string' ? value : '';
}

function getRowBoolean(row: NocoRow, key: string) {
  return Boolean(row[key]);
}

function getRowNumber(row: NocoRow, key: string) {
  const value = row[key];
  return typeof value === 'number' ? value : undefined;
}

async function fetchTableRequest(baseUrl: string, token: string, tableId: string, method: 'POST' | 'PATCH' | 'DELETE', records: NocoRow[]) {
  const response = await fetch(`${baseUrl}/api/v2/tables/${tableId}/records`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'xc-token': token,
    },
    body: JSON.stringify(records),
  });

  if (!response.ok) {
    throw new Error(`NocoDB ${method} failed with ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function createRecords(baseUrl: string, token: string, tableId: string, records: NocoRow[]) {
  return fetchTableRequest(baseUrl, token, tableId, 'POST', records);
}

async function patchRecords(baseUrl: string, token: string, tableId: string, records: NocoRow[]) {
  return fetchTableRequest(baseUrl, token, tableId, 'PATCH', records);
}

async function deleteRecords(baseUrl: string, token: string, tableId: string, records: NocoRow[]) {
  return fetchTableRequest(baseUrl, token, tableId, 'DELETE', records);
}

function buildProtocolOptions(rows: NocoRow[]) {
  return rows
    .map((row): DeviceOption | null => {
      const key = getRowString(row, 'protocol_key');
      const label = getRowString(row, 'protocol_name');
      return key && label ? { key, label } : null;
    })
    .filter((value): value is DeviceOption => Boolean(value))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildConnectivityOptions(rows: NocoRow[]) {
  const options = rows
    .map((row): DeviceOption | null => {
      const key = getRowString(row, 'connectivity_key');
      const rawLabel = getRowString(row, 'connectivity_type');
      const label = rawLabel === 'Ethernet RJ45' || rawLabel === 'PoE' || rawLabel === 'Ethernet' ? MERGED_WIRED_CONNECTIVITY_LABEL : rawLabel;
      const normalizedKey = rawLabel === 'Ethernet RJ45' || rawLabel === 'PoE' || rawLabel === 'Ethernet' ? MERGED_WIRED_CONNECTIVITY_KEY : key;

      return normalizedKey && label ? { key: normalizedKey, label } : null;
    })
    .filter((value): value is DeviceOption => Boolean(value));

  return [...new Map(options.map((option) => [option.key, option])).values()]
    .sort((a, b) => a.label.localeCompare(b.label));
}

function normalizeConnectivityLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed === 'Ethernet RJ45' || trimmed === 'PoE' || trimmed === 'Ethernet') {
    return MERGED_WIRED_CONNECTIVITY_LABEL;
  }
  return trimmed;
}

function normalizeConnectivityKeysForSave(selectedKeys: string[]) {
  return [...new Set(selectedKeys.map((key) => (key === 'conn_eth' || key === 'conn_poe' ? MERGED_WIRED_CONNECTIVITY_KEY : key)))];
}

function splitMultilineField(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitSensorField(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeSensorField(value: string) {
  return splitSensorField(value).join(',');
}

function inferBatteryLifeEstimate(specs: Pick<Device['specs'], 'batteryLifeEstimate' | 'powerSupply' | 'batteryCapacity' | 'replaceableBattery'>) {
  if (specs.batteryLifeEstimate?.trim()) return specs.batteryLifeEstimate.trim();

  const powerText = `${specs.powerSupply ?? ''} ${specs.batteryCapacity ?? ''}`.toLowerCase();
  const hasExternalPower = /\bpoe\b|\bdc\b|\bac\b|\busb\b|external|hard-wired|wired/.test(powerText);
  const hasBattery = Boolean(specs.batteryCapacity?.trim()) || Boolean(specs.replaceableBattery);

  if (hasExternalPower && hasBattery) return 'External power with battery backup';
  if (hasExternalPower) return 'Externally powered';
  if (hasBattery) return 'Battery-powered';

  return '';
}

function getBatteryLifeLabel(device: Device) {
  return device.specs.batteryLifeEstimate?.trim() || inferBatteryLifeEstimate(device.specs) || 'Not mapped';
}

function normalizeSearchTerms(query: string) {
  const ignored = new Set(['a', 'an', 'and', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with']);

  return query
    .toLowerCase()
    .split(/[^a-z0-9.+-]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1 && !ignored.has(term));
}

function createEmptyDeviceDraft(): DeviceSavePayload {
  return {
    key: '',
    category: 'gateway',
    title: '',
    manufacturer: '',
    modelNumber: '',
    subcategory: '',
    role: '',
    status: 'active',
    description: '',
    vendorProductUrl: '',
    datasheetPath: '',
    tags: [],
    specs: {
      bluetoothVersion: '',
      sensors: '',
      batteryLifeEstimate: '',
      ipRating: '',
      backhaulType: '',
      powerSupply: '',
      installation: '',
      batteryCapacity: '',
      dimensions: '',
      weight: '',
    },
    connectivityKeys: [],
    protocols: [],
    gatewayProfile: {
      edgeComputingMode: '',
      configurationMethod: '',
      configurableParameters: '',
      notes: '',
    },
    anchorProfile: {
      positioningTechnology: '',
      positioningAccuracy: '',
      installationHeight: '',
      mountingMode: '',
      networkProtocols: '',
      commissioningNotes: '',
      notes: '',
    },
  };
}

function matchesQuery(device: Device, query: string) {
  if (!query) return true;

  const searchTerms = normalizeSearchTerms(query);
  if (!searchTerms.length) return true;

  const variantTerms = (device.variants ?? []).flatMap((variant) => [
    variant.label,
    variant.chipset,
    ...variant.workModes,
    ...variant.firmwareSummary,
    ...variant.sensors,
    ...variant.notes,
  ]);

  const haystack = [
    device.title,
    device.deviceName,
    device.manufacturer,
    device.category,
    device.subcategory,
    device.role,
    device.description,
    ...device.applications,
    ...device.tags,
    ...device.connectivity,
    ...device.protocolNames,
    ...(device.specs.sensors ?? []),
    device.specs.batteryLifeEstimate,
    getBatteryLifeLabel(device),
    device.specs.batteryCapacity,
    device.specs.powerSupply,
    device.specs.backhaulType,
    device.gatewayProfile?.edgeComputingMode,
    device.anchorProfile?.positioningTechnology,
    device.gatewayProfile?.centralEngineDependency,
    device.anchorProfile?.commissioningNotes,
    device.variantGroup,
    ...variantTerms,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchTerms.every((term) => haystack.includes(term));
}

function includesEverySelection(deviceValues: string[], selectedValues: string[]) {
  if (!selectedValues.length) return true;
  const normalized = deviceValues.map((value) => value.toLowerCase());
  return selectedValues.every((value) => normalized.includes(value.toLowerCase()));
}

function includesAnySelection(deviceValue: string | undefined, selectedValues: string[]) {
  if (!selectedValues.length) return true;
  if (!deviceValue) return false;
  return selectedValues.includes(deviceValue);
}

async function fetchTable(baseUrl: string, token: string, tableId: string) {
  const url = new URL(`${baseUrl}/api/v2/tables/${tableId}/records`);
  url.searchParams.set('limit', '200');

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'xc-token': token,
    },
  });

  if (!response.ok) {
    throw new Error(`NocoDB returned ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return Array.isArray(json) ? json : json.list ?? json.data ?? [];
}

function mapRowsToDevices(rows: {
  devices: NocoRow[];
  deviceSpecs: NocoRow[];
  connectivityOptions: NocoRow[];
  deviceConnectivity: NocoRow[];
  protocols: NocoRow[];
  deviceProtocols: NocoRow[];
  applications: NocoRow[];
  deviceApplications: NocoRow[];
  businessTags: NocoRow[];
  deviceTags: NocoRow[];
  gatewayProfiles: NocoRow[];
  anchorProfiles: NocoRow[];
  deviceVariants: NocoRow[];
}) {
  const deviceById = new Map(rows.devices.map((row) => [String(row.Id), row]));
  const specsByKey = new Map(rows.deviceSpecs.map((row) => [row.device_key, row]));
  const specsByDeviceId = new Map(
    rows.deviceSpecs
      .map((row) => [getLinkedId(row.device_ref) ?? (row.nc_24rw___devices_id ? String(row.nc_24rw___devices_id) : null), row] as const)
      .filter((entry): entry is [string, NocoRow] => Boolean(entry[0])),
  );
  const gatewayByKey = new Map(rows.gatewayProfiles.map((row) => [row.device_key, row]));
  const gatewayByDeviceId = new Map(
    rows.gatewayProfiles
      .map((row) => [getLinkedId(row.device_ref) ?? (row.nc_24rw___devices_id ? String(row.nc_24rw___devices_id) : null), row] as const)
      .filter((entry): entry is [string, NocoRow] => Boolean(entry[0])),
  );
  const anchorByKey = new Map(rows.anchorProfiles.map((row) => [row.device_key, row]));
  const anchorByDeviceId = new Map(
    rows.anchorProfiles
      .map((row) => [getLinkedId(row.device_ref) ?? (row.nc_24rw___devices_id ? String(row.nc_24rw___devices_id) : null), row] as const)
      .filter((entry): entry is [string, NocoRow] => Boolean(entry[0])),
  );
  const connectivityByKey = new Map(rows.connectivityOptions.map((row) => [row.connectivity_key, row]));
  const connectivityById = new Map(rows.connectivityOptions.map((row) => [String(row.Id), row]));
  const protocolByKey = new Map(rows.protocols.map((row) => [row.protocol_key, row]));
  const protocolById = new Map(rows.protocols.map((row) => [String(row.Id), row]));
  const applicationByKey = new Map(rows.applications.map((row) => [row.application_key, row]));
  const applicationById = new Map(rows.applications.map((row) => [String(row.Id), row]));
  const tagByKey = new Map(rows.businessTags.map((row) => [row.tag_key, row]));
  const tagById = new Map(rows.businessTags.map((row) => [String(row.Id), row]));
  const variantsByKey = rows.deviceVariants.reduce<Record<string, NocoRow[]>>((accumulator, row) => {
    const linkedDeviceId = getLinkedId(row.device_ref) ?? (row.nc_24rw___devices_id ? String(row.nc_24rw___devices_id) : null);
    const linkedDeviceKey = linkedDeviceId ? getRowString(deviceById.get(linkedDeviceId) ?? {}, 'device_key') : '';
    const bucketKey = linkedDeviceKey || getRowString(row, 'device_key');

    if (bucketKey) {
      accumulator[bucketKey] ??= [];
      accumulator[bucketKey].push(row);
    }

    return accumulator;
  }, {});

  const connectivityLinks = rows.deviceConnectivity.reduce<Record<string, NocoRow[]>>((accumulator, row) => {
    const linkedDeviceId = getLinkedId(row.device_ref) ?? (row.nc_24rw___devices_id ? String(row.nc_24rw___devices_id) : null);
    const linkedDeviceKey = linkedDeviceId ? getRowString(deviceById.get(linkedDeviceId) ?? {}, 'device_key') : '';
    const bucketKey = linkedDeviceKey || getRowString(row, 'device_key');

    if (bucketKey) {
      accumulator[bucketKey] ??= [];
      accumulator[bucketKey].push(row);
    }

    return accumulator;
  }, {});

  const protocolLinks = rows.deviceProtocols.reduce<Record<string, NocoRow[]>>((accumulator, row) => {
    const linkedDeviceId = getLinkedId(row.device_ref) ?? (row.nc_24rw___devices_id ? String(row.nc_24rw___devices_id) : null);
    const linkedDeviceKey = linkedDeviceId ? getRowString(deviceById.get(linkedDeviceId) ?? {}, 'device_key') : '';
    const bucketKey = linkedDeviceKey || getRowString(row, 'device_key');

    if (bucketKey) {
      accumulator[bucketKey] ??= [];
      accumulator[bucketKey].push(row);
    }

    return accumulator;
  }, {});

  const applicationLinks = rows.deviceApplications.reduce<Record<string, NocoRow[]>>((accumulator, row) => {
    const linkedDeviceId = getLinkedId(row.device_ref) ?? (row.nc_24rw___devices_id ? String(row.nc_24rw___devices_id) : null);
    const linkedDeviceKey = linkedDeviceId ? getRowString(deviceById.get(linkedDeviceId) ?? {}, 'device_key') : '';
    const bucketKey = linkedDeviceKey || getRowString(row, 'device_key');

    if (bucketKey) {
      accumulator[bucketKey] ??= [];
      accumulator[bucketKey].push(row);
    }

    return accumulator;
  }, {});

  const tagLinks = rows.deviceTags.reduce<Record<string, NocoRow[]>>((accumulator, row) => {
    const linkedDeviceId = getLinkedId(row.device_ref) ?? (row.nc_24rw___devices_id ? String(row.nc_24rw___devices_id) : null);
    const linkedDeviceKey = linkedDeviceId ? getRowString(deviceById.get(linkedDeviceId) ?? {}, 'device_key') : '';
    const bucketKey = linkedDeviceKey || getRowString(row, 'device_key');

    if (bucketKey) {
      accumulator[bucketKey] ??= [];
      accumulator[bucketKey].push(row);
    }

    return accumulator;
  }, {});

  return rows.devices.map((deviceRow, index): Device => {
    const deviceId = String(deviceRow.Id);
    const deviceKey = getRowString(deviceRow, 'device_key');
    const specs = specsByDeviceId.get(deviceId) ?? specsByKey.get(deviceKey) ?? {};
    const gatewayProfileRow = gatewayByDeviceId.get(deviceId) ?? gatewayByKey.get(deviceKey);
    const anchorProfileRow = anchorByDeviceId.get(deviceId) ?? anchorByKey.get(deviceKey);
    const variants = (variantsByKey[deviceKey] ?? [])
      .sort((a, b) => (getRowNumber(a, 'sort_order') ?? 0) - (getRowNumber(b, 'sort_order') ?? 0))
      .map((variantRow) => ({
        id: String(variantRow.Id ?? getRowString(variantRow, 'variant_key')),
        label: getRowString(variantRow, 'variant_label') || getRowString(variantRow, 'title'),
        chipset: getRowString(variantRow, 'chipset'),
        workModes: splitMultilineField(getRowString(variantRow, 'work_modes')),
        firmwareSummary: splitMultilineField(getRowString(variantRow, 'firmware_summary')),
        sensors: splitMultilineField(getRowString(variantRow, 'sensors')),
        notes: splitMultilineField(getRowString(variantRow, 'other_notes')),
      }));

    const protocols: DeviceProtocol[] = (protocolLinks[deviceKey] ?? []).map((link): DeviceProtocol => {
      const protocolKey = getRowString(link, 'protocol_key');
      const linkedProtocolId = getLinkedId(link.protocol_ref) ?? String(link.nc_24rw___protocols_id ?? '');
      return {
        key: protocolKey || getRowString(protocolById.get(linkedProtocolId) ?? {}, 'protocol_key'),
        name:
          getLinkedTitle(link.protocol_ref) ||
          getRowString(protocolById.get(linkedProtocolId) ?? {}, 'protocol_name') ||
          getRowString(protocolByKey.get(protocolKey) ?? {}, 'protocol_name') ||
          protocolKey,
        direction: getRowString(link, 'direction') || 'unspecified',
        details: getRowString(link, 'details'),
      };
    });

    const connectivity = uniqueSorted(
      (connectivityLinks[deviceKey] ?? []).map(
        (link) =>
          normalizeConnectivityLabel(
            getLinkedTitle(link.connectivity_ref) ??
              (getRowString(connectivityById.get(getLinkedId(link.connectivity_ref) ?? String(link.nc_24rw___connectivity_options_id ?? '')) ?? {}, 'connectivity_type') ||
                getRowString(connectivityByKey.get(getRowString(link, 'connectivity_key')) ?? {}, 'connectivity_type') ||
                getRowString(link, 'details')),
          ),
      ),
    );

    const applications = uniqueSorted(
      (applicationLinks[deviceKey] ?? []).map(
        (link) =>
          getLinkedTitle(link.application_ref) ??
          (getRowString(applicationById.get(getLinkedId(link.application_ref) ?? String(link.nc_24rw___applications_id ?? '')) ?? {}, 'application_name') ||
            getRowString(applicationByKey.get(getRowString(link, 'application_key')) ?? {}, 'application_name')),
      ),
    );

    const tags = uniqueSorted(
      (tagLinks[deviceKey] ?? []).map(
        (link) =>
          getLinkedTitle(link.tag_ref) ??
          (getRowString(tagById.get(getLinkedId(link.tag_ref) ?? String(link.nc_24rw___business_tags_id ?? '')) ?? {}, 'tag_name') ||
            getRowString(tagByKey.get(getRowString(link, 'tag_key')) ?? {}, 'tag_name')),
      ),
    );

    const documents: DeviceDocument[] = uniqueSorted([
      getRowString(deviceRow, 'datasheet_path'),
      getRowString(specs, 'manual_path'),
      getRowString(specs, 'sop_path'),
    ]).map((path, documentIndex) => ({
      label: documentIndex === 0 ? 'Primary Document' : `Document ${documentIndex + 1}`,
      path,
    }));

    const category = ((getRowString(deviceRow, 'category') || 'gateway') as Device['category']);

    return {
      id: String(deviceRow.Id ?? index + 1),
      key: deviceKey,
      title: getRowString(deviceRow, 'title') || getRowString(deviceRow, 'device_name') || 'Unnamed Device',
      deviceName: getRowString(deviceRow, 'device_name') || getRowString(deviceRow, 'title') || 'Unnamed Device',
      modelNumber: getRowString(deviceRow, 'model_number'),
      manufacturer: getRowString(deviceRow, 'manufacturer') || 'Unknown',
      category,
      subcategory: getRowString(deviceRow, 'subcategory'),
      role: getRowString(deviceRow, 'role'),
      status: getRowString(deviceRow, 'status') || 'active',
      description: getRowString(deviceRow, 'description') || 'No description available.',
      vendorProductUrl: getRowString(deviceRow, 'vendor_product_url'),
      datasheetPath: getRowString(deviceRow, 'datasheet_path'),
      applications,
      tags,
      connectivity,
      protocols,
      protocolNames: uniqueSorted(protocols.map((protocol) => protocol.name)),
      specs: {
        bluetoothVersion: getRowString(specs, 'bluetooth_version'),
        sensors: splitSensorField(getRowString(specs, 'sensors')),
        batteryLifeEstimate:
          getRowString(specs, 'battery_life_estimate') ||
          inferBatteryLifeEstimate({
            batteryLifeEstimate: getRowString(specs, 'battery_life_estimate'),
            powerSupply: getRowString(specs, 'power_supply'),
            batteryCapacity: getRowString(specs, 'battery_capacity'),
            replaceableBattery: getRowBoolean(specs, 'replaceable_battery'),
          }),
        wifiSupport: getRowBoolean(specs, 'wifi_support'),
        wifiBand: getRowString(specs, 'wifi_band'),
        ethernetSupport: getRowBoolean(specs, 'ethernet_support'),
        poeSupport: getRowBoolean(specs, 'poe_support'),
        poeStandard: getRowString(specs, 'poe_standard'),
        rj45Support: getRowBoolean(specs, 'rj45_support'),
        cellularSupport: getRowBoolean(specs, 'cellular_support'),
        cellularType: getRowString(specs, 'cellular_type'),
        gnssSupport: getRowBoolean(specs, 'gnss_support'),
        lteSupport: getRowBoolean(specs, 'lte_support'),
        lteCategory: getRowString(specs, 'lte_category'),
        ipRating: getRowString(specs, 'ip_rating'),
        operatingTempMinC: getRowNumber(specs, 'operating_temp_min_c'),
        operatingTempMaxC: getRowNumber(specs, 'operating_temp_max_c'),
        batteryCapacity: getRowString(specs, 'battery_capacity'),
        replaceableBattery: getRowBoolean(specs, 'replaceable_battery'),
        dimensions: getRowString(specs, 'dimensions'),
        weight: getRowString(specs, 'weight'),
        powerSupply: getRowString(specs, 'power_supply'),
        installation: getRowString(specs, 'installation'),
        material: getRowString(specs, 'material'),
        backhaulType: getRowString(specs, 'backhaul_type'),
        indoorOutdoorRating: getRowString(specs, 'indoor_outdoor_rating'),
        maxSignalRangeOpenSpace: getRowString(specs, 'max_signal_range_open_space'),
        maxSignalRangeRealWorld: getRowString(specs, 'max_signal_range_real_world'),
      },
      gatewayProfile: category === 'gateway' && gatewayProfileRow
        ? {
            payloadFormat: getRowString(gatewayProfileRow, 'payload_format'),
            uplinkProtocols: uniqueSorted(
              [
                getRowBoolean(gatewayProfileRow, 'uplink_mqtt') ? 'MQTT' : '',
                getRowBoolean(gatewayProfileRow, 'uplink_http') ? 'HTTP' : '',
                getRowBoolean(gatewayProfileRow, 'uplink_https') ? 'HTTPS' : '',
                getRowBoolean(gatewayProfileRow, 'uplink_websocket') ? 'WebSocket' : '',
                getRowBoolean(gatewayProfileRow, 'uplink_tcp') ? 'TCP' : '',
                getRowBoolean(gatewayProfileRow, 'uplink_udp') ? 'UDP' : '',
              ].filter(Boolean),
            ),
            downlinkSupported: getRowBoolean(gatewayProfileRow, 'downlink_supported'),
            configurationMethod: getRowString(gatewayProfileRow, 'configuration_method'),
            mqttTopicExample: getRowString(gatewayProfileRow, 'mqtt_topic_example'),
            mqttPayloadExample: getRowString(gatewayProfileRow, 'mqtt_payload_json_example'),
            httpsEndpoint: getRowString(gatewayProfileRow, 'https_endpoint'),
            websocketEndpoint: getRowString(gatewayProfileRow, 'websocket_endpoint'),
            edgeComputingMode: getRowString(gatewayProfileRow, 'edge_computing_mode'),
            calculatesCoordinatesLocally: getRowBoolean(gatewayProfileRow, 'calculates_coordinates_locally'),
            forwardsRawSignals: getRowBoolean(gatewayProfileRow, 'forwards_raw_signals'),
            supportsRefreshRateConfig: getRowBoolean(gatewayProfileRow, 'supports_refresh_rate_config'),
            supportsLedControl: getRowBoolean(gatewayProfileRow, 'supports_led_control'),
            supportsBuzzerControl: getRowBoolean(gatewayProfileRow, 'supports_buzzer_control'),
            nodeRedIntegrationReady: getRowBoolean(gatewayProfileRow, 'node_red_integration_ready'),
            centralEngineDependency: getRowString(gatewayProfileRow, 'central_engine_dependency'),
            configurableParameters: getRowString(gatewayProfileRow, 'configurable_parameters'),
            notes: getRowString(gatewayProfileRow, 'notes'),
          }
        : undefined,
      anchorProfile: category === 'anchor' && anchorProfileRow
        ? {
            positioningTechnology: getRowString(anchorProfileRow, 'positioning_technology'),
            positioningAccuracy: getRowString(anchorProfileRow, 'positioning_accuracy'),
            installationHeight: getRowString(anchorProfileRow, 'installation_height'),
            coverageArea: getRowString(anchorProfileRow, 'coverage_area'),
            networkProtocols: getRowString(anchorProfileRow, 'network_protocols'),
            cascadeSupported: getRowBoolean(anchorProfileRow, 'cascade_supported'),
            mountingMode: getRowString(anchorProfileRow, 'mounting_mode'),
            syncRequirement: getRowString(anchorProfileRow, 'sync_requirement'),
            recommendedAnchorSpacing: getRowString(anchorProfileRow, 'recommended_anchor_spacing'),
            recommendedAnchorDensity: getRowString(anchorProfileRow, 'recommended_anchor_density'),
            lineOfSightRequirement: getRowString(anchorProfileRow, 'line_of_sight_requirement'),
            metalInterferenceRisk: getRowString(anchorProfileRow, 'metal_interference_risk'),
            rawSignalForwarding: getRowBoolean(anchorProfileRow, 'raw_signal_forwarding'),
            positioningEngineLocation: getRowString(anchorProfileRow, 'positioning_engine_location'),
            installationPrerequisites: getRowString(anchorProfileRow, 'installation_prerequisites'),
            commissioningNotes: getRowString(anchorProfileRow, 'commissioning_notes'),
            notes: getRowString(anchorProfileRow, 'notes'),
          }
        : undefined,
      variantGroup: getRowString(deviceRow, 'variant_group'),
      variants,
      documents,
    };
  });
}

function App() {
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedDeviceKey, setSelectedDeviceKey] = useState<string | null>(null);
  const [newDeviceDraft, setNewDeviceDraft] = useState<DeviceSavePayload | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [protocolOptions, setProtocolOptions] = useState<DeviceOption[]>([
    { key: 'proto_mqtt', label: 'MQTT' },
    { key: 'proto_http', label: 'HTTP' },
    { key: 'proto_udp', label: 'UDP' },
    { key: 'proto_ble', label: 'BLE' },
  ]);
  const [connectivityOptions, setConnectivityOptions] = useState<DeviceOption[]>([
    { key: 'conn_ble', label: 'BLE' },
    { key: MERGED_WIRED_CONNECTIVITY_KEY, label: MERGED_WIRED_CONNECTIVITY_LABEL },
    { key: 'conn_cellular', label: 'Cellular' },
    { key: 'conn_gnss', label: 'GNSS' },
  ]);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [businessTagOptions, setBusinessTagOptions] = useState<string[]>(uniqueSorted(mockDevices.flatMap((device) => device.tags)));

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const baseUrl = import.meta.env.VITE_NOCODB_BASE_URL;
  const apiKey = import.meta.env.VITE_NOCODB_API_KEY;
  const canEditDatabase = Boolean(baseUrl && apiKey);

  const loadDataset = useCallback(async () => {
    if (!baseUrl || !apiKey) {
      setConnectionStatus('idle');
      setConnectionError('NocoDB credentials are missing, so the app is using local mock data.');
      return;
    }

    setConnectionStatus('checking');
    setConnectionError(null);

    try {
      const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
      const [
        deviceRows,
        specsRows,
        connectivityRows,
        deviceConnectivityRows,
        protocolRows,
        deviceProtocolRows,
        applicationRows,
        deviceApplicationRows,
        tagRows,
        deviceTagRows,
        gatewayProfileRows,
        anchorProfileRows,
        deviceVariantRows,
      ] = await Promise.all([
        fetchTable(normalizedBaseUrl, apiKey, tableIds.devices),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceSpecs),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.connectivityOptions),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceConnectivity),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.protocols),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceProtocols),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.applications),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceApplications),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.businessTags),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceTags),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.gatewayProfiles),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.anchorProfiles),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceVariants),
      ]);

      const normalizedDevices = mapRowsToDevices({
        devices: deviceRows,
        deviceSpecs: specsRows,
        connectivityOptions: connectivityRows,
        deviceConnectivity: deviceConnectivityRows,
        protocols: protocolRows,
        deviceProtocols: deviceProtocolRows,
        applications: applicationRows,
        deviceApplications: deviceApplicationRows,
        businessTags: tagRows,
        deviceTags: deviceTagRows,
        gatewayProfiles: gatewayProfileRows,
        anchorProfiles: anchorProfileRows,
        deviceVariants: deviceVariantRows,
      });

      setDevices(normalizedDevices);
      setProtocolOptions(buildProtocolOptions(protocolRows));
      setConnectivityOptions(buildConnectivityOptions(connectivityRows));
      setBusinessTagOptions(uniqueSorted((tagRows as NocoRow[]).map((row: NocoRow) => getRowString(row, 'tag_name')).filter(Boolean)));
      setSelectedDeviceKey((current) => normalizedDevices.find((device) => device.key === current)?.key ?? null);
      setConnectionStatus('connected');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setConnectionStatus('failed');
      setConnectionError(`Failed to load linked NocoDB tables. ${message}`);
      setDevices(mockDevices);
      setBusinessTagOptions(uniqueSorted(mockDevices.flatMap((device) => device.tags)));
      setSelectedDeviceKey(null);
    }
  }, [apiKey, baseUrl]);

  useEffect(() => {
    void loadDataset();
  }, [loadDataset]);

  const filteredDevices = devices.filter((device) => {
    if (!matchesQuery(device, deferredSearchQuery)) return false;
    if (filters.categories.length && !filters.categories.includes(getDeviceUiCategoryLabel(device))) return false;
    if (filters.manufacturers.length && !filters.manufacturers.includes(device.manufacturer)) return false;
    if (filters.status.length && !filters.status.includes(device.status)) return false;
    if (filters.batteryLife.length && !filters.batteryLife.includes(getBatteryLifeLabel(device))) return false;
    if (filters.ipRatings.length && !includesAnySelection(device.specs.ipRating, filters.ipRatings)) return false;
    if (filters.edgeModes.length && !includesAnySelection(device.gatewayProfile?.edgeComputingMode, filters.edgeModes)) return false;
    if (!includesEverySelection(device.applications, filters.applications)) return false;
    if (!includesEverySelection(device.protocolNames, filters.protocols)) return false;
    if (!includesEverySelection(device.connectivity, filters.connectivity)) return false;
    if (!includesEverySelection(device.tags, filters.tags)) return false;
    if (filters.requirePoe && !device.specs.poeSupport) return false;
    if (filters.requireEthernet && !device.specs.ethernetSupport) return false;
    if (filters.requireWifi && !device.specs.wifiSupport) return false;
    if (filters.requireCellular && !device.specs.cellularSupport) return false;
    if (filters.requireGnss && !device.specs.gnssSupport) return false;
    if (filters.requireLocalCompute && !device.gatewayProfile?.calculatesCoordinatesLocally) return false;

    return true;
  });

  const selectedDevice = selectedDeviceKey ? filteredDevices.find((device) => device.key === selectedDeviceKey) ?? null : null;

  const filterOptions = {
    categories: uniqueSorted(devices.map((device) => getDeviceUiCategoryLabel(device))),
    manufacturers: uniqueSorted(devices.map((device) => device.manufacturer)),
    applications: uniqueSorted(devices.flatMap((device) => device.applications)),
    protocols: uniqueSorted(devices.flatMap((device) => device.protocolNames)),
    connectivity: uniqueSorted(devices.flatMap((device) => device.connectivity)),
    tags: uniqueSorted(devices.flatMap((device) => device.tags)),
    batteryLife: uniqueSorted(devices.map((device) => getBatteryLifeLabel(device)).filter((value) => value !== 'Not mapped')),
    ipRatings: uniqueSorted(devices.map((device) => device.specs.ipRating)),
    edgeModes: uniqueSorted(devices.map((device) => device.gatewayProfile?.edgeComputingMode)),
    statuses: uniqueSorted(devices.map((device) => device.status)),
  };

  const selectedFilterChips = [
    ...filters.categories.map((value) => ({ key: `categories:${value}`, label: `Category: ${value}` })),
    ...filters.connectivity.map((value) => ({ key: `connectivity:${value}`, label: `Connectivity: ${value}` })),
    ...filters.batteryLife.map((value) => ({ key: `batteryLife:${value}`, label: `Battery: ${value}` })),
    ...filters.applications.map((value) => ({ key: `applications:${value}`, label: `Use Case: ${value}` })),
    ...filters.status.map((value) => ({ key: `status:${value}`, label: `Status: ${value}` })),
    ...filters.manufacturers.map((value) => ({ key: `manufacturers:${value}`, label: `Manufacturer: ${value}` })),
    ...filters.protocols.map((value) => ({ key: `protocols:${value}`, label: `Protocol: ${value}` })),
    ...filters.tags.map((value) => ({ key: `tags:${value}`, label: `Tag: ${value}` })),
    ...filters.ipRatings.map((value) => ({ key: `ipRatings:${value}`, label: `IP: ${value}` })),
    ...filters.edgeModes.map((value) => ({ key: `edgeModes:${value}`, label: `Edge: ${value}` })),
  ];

  const stats = {
    total: devices.length,
    gateways: devices.filter((device) => device.category === 'gateway').length,
    anchors: devices.filter((device) => device.category === 'anchor').length,
    tags: devices.filter((device) => getDeviceUiCategory(device) === 'tag').length,
    beacons: devices.filter((device) => getDeviceUiCategory(device) === 'beacon').length,
    protocols: uniqueSorted(devices.flatMap((device) => device.protocolNames)).length,
  };

  const inventoryRailItems = [
    { key: 'all', label: 'All Devices', count: stats.total, active: !filters.categories.length, onClick: () => setSingleFilter('categories', '') },
    { key: 'gateway', label: 'Gateways', count: stats.gateways, active: filters.categories[0] === 'Gateway', onClick: () => setSingleFilter('categories', 'Gateway') },
    { key: 'anchor', label: 'Anchors', count: stats.anchors, active: filters.categories[0] === 'Anchor', onClick: () => setSingleFilter('categories', 'Anchor') },
    { key: 'tag', label: 'Tags', count: stats.tags, active: filters.categories[0] === 'Tag', onClick: () => setSingleFilter('categories', 'Tag') },
    { key: 'beacon', label: 'Beacons', count: stats.beacons, active: filters.categories[0] === 'Beacon', onClick: () => setSingleFilter('categories', 'Beacon') },
  ];

  function toggleMulti(key: keyof FilterState, value: string) {
    setFilters((current) => {
      const currentValues = current[key];
      if (!Array.isArray(currentValues)) return current;

      return {
        ...current,
        [key]: currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value],
      };
    });
  }

  function toggleBoolean(key: keyof FilterState) {
    setFilters((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function setSingleFilter(key: keyof FilterState, value: string) {
    setFilters((current) => ({
      ...current,
      [key]: value ? [value] : [],
    }));
  }

  function removeSelectedFilter(filterKey: string) {
    const [group, ...rest] = filterKey.split(':');
    const value = rest.join(':');
    if (!value) return;

    setFilters((current) => {
      const currentValues = current[group as keyof FilterState];
      if (!Array.isArray(currentValues)) return current;

      return {
        ...current,
        [group]: currentValues.filter((entry) => entry !== value),
      };
    });
  }

  function resetFilters() {
    setFilters(defaultFilters);
    setSearchQuery('');
  }

  function startCreateDevice() {
    setSelectedDeviceKey(null);
    setNewDeviceDraft(createEmptyDeviceDraft());
    setSaveState('idle');
    setSaveMessage(null);
  }

  function cancelCreateDevice() {
    setNewDeviceDraft(null);
    setSaveState('idle');
    setSaveMessage(null);
  }

  function applySidebarCategory(value: string) {
    setSingleFilter('categories', value);
    setSelectedDeviceKey(null);
  }

  async function handleSaveDeviceEdits(device: Device, payload: DeviceSavePayload) {
    if (!baseUrl || !apiKey) {
      throw new Error('NocoDB credentials are missing. Writes are disabled.');
    }

    setSaveState('saving');
    setSaveMessage(null);

    try {
      const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
      const [deviceRows, specRows, gatewayRows, anchorRows, protocolRows, connectivityRows, tagRows, deviceProtocolRows, deviceConnectivityRows, deviceTagRows] =
        await Promise.all([
          fetchTable(normalizedBaseUrl, apiKey, tableIds.devices),
          fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceSpecs),
          fetchTable(normalizedBaseUrl, apiKey, tableIds.gatewayProfiles),
          fetchTable(normalizedBaseUrl, apiKey, tableIds.anchorProfiles),
          fetchTable(normalizedBaseUrl, apiKey, tableIds.protocols),
          fetchTable(normalizedBaseUrl, apiKey, tableIds.connectivityOptions),
          fetchTable(normalizedBaseUrl, apiKey, tableIds.businessTags),
          fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceProtocols),
          fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceConnectivity),
          fetchTable(normalizedBaseUrl, apiKey, tableIds.deviceTags),
        ]);

      const deviceRow = (deviceRows as NocoRow[]).find((row: NocoRow) => getRowString(row, 'device_key') === device.key);
      if (!deviceRow) {
        throw new Error(`Device row not found for ${device.key}`);
      }

      await patchRecords(normalizedBaseUrl, apiKey, tableIds.devices, [
        {
          Id: getRowNumber(deviceRow, 'Id'),
          title: payload.title,
          device_name: payload.title,
          manufacturer: payload.manufacturer,
          model_number: payload.modelNumber,
          category: payload.category,
          subcategory: payload.subcategory,
          role: payload.role,
          status: payload.status,
          description: payload.description,
          vendor_product_url: payload.vendorProductUrl,
          datasheet_path: payload.datasheetPath,
        },
      ]);

      const specRow = (specRows as NocoRow[]).find((row: NocoRow) => getRowString(row, 'device_key') === device.key);
      const specPayload = {
        title: device.key,
        device_key: device.key,
        bluetooth_version: payload.specs.bluetoothVersion,
        sensors: normalizeSensorField(payload.specs.sensors),
        battery_life_estimate: payload.specs.batteryLifeEstimate,
        ip_rating: payload.specs.ipRating,
        backhaul_type: payload.specs.backhaulType,
        power_supply: payload.specs.powerSupply,
        installation: payload.specs.installation,
        battery_capacity: payload.specs.batteryCapacity,
        dimensions: payload.specs.dimensions,
        weight: payload.specs.weight,
      };

      if (specRow) {
        await patchRecords(normalizedBaseUrl, apiKey, tableIds.deviceSpecs, [{ Id: getRowNumber(specRow, 'Id'), ...specPayload }]);
      } else {
        await createRecords(normalizedBaseUrl, apiKey, tableIds.deviceSpecs, [specPayload]);
      }

      if (device.gatewayProfile && payload.gatewayProfile) {
        const gatewayRow = (gatewayRows as NocoRow[]).find((row: NocoRow) => getRowString(row, 'device_key') === device.key);
        const gatewayPayload = {
          title: device.key,
          device_key: device.key,
          edge_computing_mode: payload.gatewayProfile.edgeComputingMode,
          configuration_method: payload.gatewayProfile.configurationMethod,
          configurable_parameters: payload.gatewayProfile.configurableParameters,
          notes: payload.gatewayProfile.notes,
        };

        if (gatewayRow) {
          await patchRecords(normalizedBaseUrl, apiKey, tableIds.gatewayProfiles, [{ Id: getRowNumber(gatewayRow, 'Id'), ...gatewayPayload }]);
        } else {
          await createRecords(normalizedBaseUrl, apiKey, tableIds.gatewayProfiles, [gatewayPayload]);
        }
      }

      if (device.anchorProfile && payload.anchorProfile) {
        const anchorRow = (anchorRows as NocoRow[]).find((row: NocoRow) => getRowString(row, 'device_key') === device.key);
        const anchorPayload = {
          title: device.key,
          device_key: device.key,
          positioning_technology: payload.anchorProfile.positioningTechnology,
          positioning_accuracy: payload.anchorProfile.positioningAccuracy,
          installation_height: payload.anchorProfile.installationHeight,
          mounting_mode: payload.anchorProfile.mountingMode,
          network_protocols: payload.anchorProfile.networkProtocols,
          commissioning_notes: payload.anchorProfile.commissioningNotes,
          notes: payload.anchorProfile.notes,
        };

        if (anchorRow) {
          await patchRecords(normalizedBaseUrl, apiKey, tableIds.anchorProfiles, [{ Id: getRowNumber(anchorRow, 'Id'), ...anchorPayload }]);
        } else {
          await createRecords(normalizedBaseUrl, apiKey, tableIds.anchorProfiles, [anchorPayload]);
        }
      }

      const protocolByKey = new Map((protocolRows as NocoRow[]).map((row: NocoRow) => [getRowString(row, 'protocol_key'), row]));
      const connectivityByKey = new Map((connectivityRows as NocoRow[]).map((row: NocoRow) => [getRowString(row, 'connectivity_key'), row]));
      const businessTagByLabel = new Map((tagRows as NocoRow[]).map((row: NocoRow) => [getRowString(row, 'tag_name'), row]));
      const existingProtocolRows = (deviceProtocolRows as NocoRow[]).filter((row: NocoRow) => getRowString(row, 'device_key') === device.key);
      const existingConnectivityRows = (deviceConnectivityRows as NocoRow[]).filter((row: NocoRow) => getRowString(row, 'device_key') === device.key);
      const existingTagRows = (deviceTagRows as NocoRow[]).filter((row: NocoRow) => getRowString(row, 'device_key') === device.key);

      if (existingProtocolRows.length) {
        await deleteRecords(
          normalizedBaseUrl,
          apiKey,
          tableIds.deviceProtocols,
          existingProtocolRows.map((row: NocoRow) => ({ Id: getRowNumber(row, 'Id') })),
        );
      }

      const nextProtocolRows = payload.protocols
        .filter((protocol) => protocol.protocolKey)
        .map((protocol) => {
          const protocolRow = protocolByKey.get(protocol.protocolKey);
          return {
            title: `${device.key} | ${protocol.protocolKey} | ${protocol.direction || 'unspecified'}`,
            device_key: device.key,
            protocol_key: protocol.protocolKey,
            direction: protocol.direction || 'unspecified',
            details: protocol.details,
            nc_24rw___devices_id: Number(device.id),
            nc_24rw___protocols_id: getRowNumber(protocolRow ?? ({} as NocoRow), 'Id'),
          };
        });

      if (nextProtocolRows.length) {
        await createRecords(normalizedBaseUrl, apiKey, tableIds.deviceProtocols, nextProtocolRows);
      }

      if (existingConnectivityRows.length) {
        await deleteRecords(
          normalizedBaseUrl,
          apiKey,
          tableIds.deviceConnectivity,
          existingConnectivityRows.map((row: NocoRow) => ({ Id: getRowNumber(row, 'Id') })),
        );
      }

      const nextConnectivityRows = normalizeConnectivityKeysForSave(payload.connectivityKeys)
        .filter(Boolean)
        .map((connectivityKey) => {
          const connectivityRow = connectivityByKey.get(connectivityKey);
          const connectivityLabel = getRowString(connectivityRow ?? ({} as NocoRow), 'connectivity_type');
          return {
            title: `${device.key} | ${connectivityKey}`,
            device_key: device.key,
            connectivity_key: connectivityKey,
            details: connectivityLabel,
            nc_24rw___devices_id: Number(device.id),
            nc_24rw___connectivity_options_id: getRowNumber(connectivityRow ?? ({} as NocoRow), 'Id'),
          };
        });

      if (nextConnectivityRows.length) {
        await createRecords(normalizedBaseUrl, apiKey, tableIds.deviceConnectivity, nextConnectivityRows);
      }

      if (existingTagRows.length) {
        await deleteRecords(
          normalizedBaseUrl,
          apiKey,
          tableIds.deviceTags,
          existingTagRows.map((row: NocoRow) => ({ Id: getRowNumber(row, 'Id') })),
        );
      }

      const nextTagRows: NocoRow[] = payload.tags
        .filter(Boolean)
        .flatMap((tagLabel) => {
          const tagRow = businessTagByLabel.get(tagLabel);
          if (!tagRow) return [];

          return [
            {
              title: `${device.key} | ${getRowString(tagRow, 'tag_key') || tagLabel}`,
              device_key: device.key,
              tag_key: getRowString(tagRow, 'tag_key'),
              nc_24rw___devices_id: Number(device.id),
              nc_24rw___business_tags_id: getRowNumber(tagRow, 'Id'),
            },
          ];
        });

      if (nextTagRows.length) {
        await createRecords(normalizedBaseUrl, apiKey, tableIds.deviceTags, nextTagRows);
      }

      await loadDataset();
      setNewDeviceDraft(null);
      setSaveState('saved');
      setSaveMessage('Device changes saved to NocoDB.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveState('failed');
      setSaveMessage(message);
      throw error;
    }
  }

  async function handleCreateDevice(payload: DeviceSavePayload) {
    if (!baseUrl || !apiKey) {
      throw new Error('NocoDB credentials are missing. Writes are disabled.');
    }

    if (!payload.key.trim()) {
      throw new Error('Device key is required.');
    }

    if (!payload.title.trim()) {
      throw new Error('Device title is required.');
    }

    setSaveState('saving');
    setSaveMessage(null);

    try {
      const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
      const [deviceRows, protocolRows, connectivityRows, tagRows] = await Promise.all([
        fetchTable(normalizedBaseUrl, apiKey, tableIds.devices),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.protocols),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.connectivityOptions),
        fetchTable(normalizedBaseUrl, apiKey, tableIds.businessTags),
      ]);

      const existingDevice = (deviceRows as NocoRow[]).find((row: NocoRow) => getRowString(row, 'device_key') === payload.key.trim());
      if (existingDevice) {
        throw new Error(`A device with key "${payload.key}" already exists.`);
      }

      const createdDeviceResponse = await createRecords(normalizedBaseUrl, apiKey, tableIds.devices, [
        {
          title: payload.title,
          device_key: payload.key.trim(),
          device_name: payload.title,
          manufacturer: payload.manufacturer,
          model_number: payload.modelNumber,
          category: payload.category,
          subcategory: payload.subcategory,
          role: payload.role,
          description: payload.description,
          datasheet_path: payload.datasheetPath,
          vendor_product_url: payload.vendorProductUrl,
          status: payload.status,
        },
      ]);

      const createdDevice = Array.isArray(createdDeviceResponse) ? createdDeviceResponse[0] : createdDeviceResponse;
      const createdDeviceId = getRowNumber(createdDevice as NocoRow, 'Id');
      if (!createdDeviceId) {
        throw new Error('NocoDB did not return the created device ID.');
      }

      await createRecords(normalizedBaseUrl, apiKey, tableIds.deviceSpecs, [
        {
          title: payload.key.trim(),
          device_key: payload.key.trim(),
          bluetooth_version: payload.specs.bluetoothVersion,
          sensors: normalizeSensorField(payload.specs.sensors),
          battery_life_estimate: payload.specs.batteryLifeEstimate,
          ip_rating: payload.specs.ipRating,
          backhaul_type: payload.specs.backhaulType,
          power_supply: payload.specs.powerSupply,
          installation: payload.specs.installation,
          battery_capacity: payload.specs.batteryCapacity,
          dimensions: payload.specs.dimensions,
          weight: payload.specs.weight,
        },
      ]);

      if (payload.category === 'gateway') {
        await createRecords(normalizedBaseUrl, apiKey, tableIds.gatewayProfiles, [
          {
            title: payload.key.trim(),
            device_key: payload.key.trim(),
            edge_computing_mode: payload.gatewayProfile?.edgeComputingMode ?? '',
            configuration_method: payload.gatewayProfile?.configurationMethod ?? '',
            configurable_parameters: payload.gatewayProfile?.configurableParameters ?? '',
            notes: payload.gatewayProfile?.notes ?? '',
          },
        ]);
      }

      if (payload.category === 'anchor') {
        await createRecords(normalizedBaseUrl, apiKey, tableIds.anchorProfiles, [
          {
            title: payload.key.trim(),
            device_key: payload.key.trim(),
            positioning_technology: payload.anchorProfile?.positioningTechnology ?? '',
            positioning_accuracy: payload.anchorProfile?.positioningAccuracy ?? '',
            installation_height: payload.anchorProfile?.installationHeight ?? '',
            mounting_mode: payload.anchorProfile?.mountingMode ?? '',
            network_protocols: payload.anchorProfile?.networkProtocols ?? '',
            commissioning_notes: payload.anchorProfile?.commissioningNotes ?? '',
            notes: payload.anchorProfile?.notes ?? '',
          },
        ]);
      }

      const protocolByKey = new Map((protocolRows as NocoRow[]).map((row: NocoRow) => [getRowString(row, 'protocol_key'), row]));
      const connectivityByKey = new Map((connectivityRows as NocoRow[]).map((row: NocoRow) => [getRowString(row, 'connectivity_key'), row]));
      const businessTagByLabel = new Map((tagRows as NocoRow[]).map((row: NocoRow) => [getRowString(row, 'tag_name'), row]));

      const nextProtocolRows = payload.protocols
        .filter((protocol) => protocol.protocolKey)
        .map((protocol) => {
          const protocolRow = protocolByKey.get(protocol.protocolKey);
          return {
            title: `${payload.key.trim()} | ${protocol.protocolKey} | ${protocol.direction || 'unspecified'}`,
            device_key: payload.key.trim(),
            protocol_key: protocol.protocolKey,
            direction: protocol.direction || 'unspecified',
            details: protocol.details,
            nc_24rw___devices_id: createdDeviceId,
            nc_24rw___protocols_id: getRowNumber(protocolRow ?? ({} as NocoRow), 'Id'),
          };
        });

      if (nextProtocolRows.length) {
        await createRecords(normalizedBaseUrl, apiKey, tableIds.deviceProtocols, nextProtocolRows);
      }

      const nextConnectivityRows = normalizeConnectivityKeysForSave(payload.connectivityKeys)
        .filter(Boolean)
        .map((connectivityKey) => {
          const connectivityRow = connectivityByKey.get(connectivityKey);
          return {
            title: `${payload.key.trim()} | ${connectivityKey}`,
            device_key: payload.key.trim(),
            connectivity_key: connectivityKey,
            details: getRowString(connectivityRow ?? ({} as NocoRow), 'connectivity_type'),
            nc_24rw___devices_id: createdDeviceId,
            nc_24rw___connectivity_options_id: getRowNumber(connectivityRow ?? ({} as NocoRow), 'Id'),
          };
        });

      if (nextConnectivityRows.length) {
        await createRecords(normalizedBaseUrl, apiKey, tableIds.deviceConnectivity, nextConnectivityRows);
      }

      const nextTagRows: NocoRow[] = payload.tags
        .filter(Boolean)
        .flatMap((tagLabel) => {
          const tagRow = businessTagByLabel.get(tagLabel);
          if (!tagRow) return [];

          return [
            {
              title: `${payload.key.trim()} | ${getRowString(tagRow, 'tag_key') || tagLabel}`,
              device_key: payload.key.trim(),
              tag_key: getRowString(tagRow, 'tag_key'),
              nc_24rw___devices_id: createdDeviceId,
              nc_24rw___business_tags_id: getRowNumber(tagRow, 'Id'),
            },
          ];
        });

      if (nextTagRows.length) {
        await createRecords(normalizedBaseUrl, apiKey, tableIds.deviceTags, nextTagRows);
      }

      await loadDataset();
      setNewDeviceDraft(null);
      setSelectedDeviceKey(payload.key.trim());
      setSaveState('saved');
      setSaveMessage('New device created in NocoDB.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveState('failed');
      setSaveMessage(message);
      throw error;
    }
  }

  return (
    <div className="app-shell min-h-screen">
      <div className="app-noise" aria-hidden="true" />
      <Sidebar
        connectionStatus={connectionStatus}
        items={inventoryRailItems.map((item) => ({
          ...item,
          onClick: () => applySidebarCategory(item.key === 'all' ? '' : item.label.slice(0, -1)),
        }))}
      />

      <CommandBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        stats={{
          devices: stats.total,
          gateways: stats.gateways,
          anchors: stats.anchors,
          tags: stats.tags,
          beacons: stats.beacons,
        }}
        onOpenAdvancedFilters={() => setIsAdvancedFilterOpen(true)}
        onAddDevice={startCreateDevice}
        canAddDevice={canEditDatabase}
      />

      <main className="min-h-screen pt-20 xl:pl-64">
        <div className="mx-auto max-w-[1680px] px-5 pb-8 xl:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-100">Hardware Inventory</h1>
            <p className="mt-2 text-sm font-mono text-slate-400">
              {filteredDevices.length} items found
              {filters.categories[0] ? ` in ${filters.categories[0]}` : ''}
            </p>
          </div>

          <HardwareSearch
            connectivityOptions={filterOptions.connectivity}
            batteryOptions={filterOptions.batteryLife}
            useCaseOptions={filterOptions.applications}
            statusOptions={filterOptions.statuses}
            selectedConnectivity={filters.connectivity[0] ?? ''}
            selectedBattery={filters.batteryLife[0] ?? ''}
            selectedUseCase={filters.applications[0] ?? ''}
            selectedStatus={filters.status[0] ?? ''}
            onConnectivityChange={(value) => setSingleFilter('connectivity', value)}
            onBatteryChange={(value) => setSingleFilter('batteryLife', value)}
            onUseCaseChange={(value) => setSingleFilter('applications', value)}
            onStatusChange={(value) => setSingleFilter('status', value)}
            selectedFilters={selectedFilterChips}
            onRemoveFilter={removeSelectedFilter}
            onResetFilters={resetFilters}
          />

          {connectionError ? (
            <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {connectionError}
            </div>
          ) : null}

          <div className="mt-6 flex items-start gap-6">
            <section
              className={`grid flex-1 grid-cols-1 gap-5 md:grid-cols-2 ${
                selectedDevice || newDeviceDraft ? '2xl:grid-cols-2' : '2xl:grid-cols-3'
              }`}
            >
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.key}
                  device={device}
                  isSelected={selectedDevice?.key === device.key}
                  onSelect={(selected) => setSelectedDeviceKey(selected.key)}
                />
              ))}

              {!filteredDevices.length && (
                <div className="col-span-full rounded-xl border border-dashed border-slate-700 bg-slate-800/30 p-12 text-center">
                  <p className="mb-4 text-sm font-mono text-slate-400">No hardware matches current query parameters.</p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                  >
                    [ Reset Filters ]
                  </button>
                </div>
              )}
            </section>

            {selectedDevice || newDeviceDraft ? (
              <div className="hidden w-[420px] shrink-0 lg:block">
                <DeviceDetailPanel
                  key={newDeviceDraft ? 'new-device' : selectedDevice?.key ?? 'empty'}
                  device={selectedDevice}
                  newDeviceDraft={newDeviceDraft}
                  canEditDatabase={canEditDatabase}
                protocolOptions={protocolOptions}
                connectivityOptions={connectivityOptions}
                tagOptions={businessTagOptions}
                saveState={saveState}
                saveMessage={saveMessage}
                  onCreateDraft={startCreateDevice}
                  onCancelCreate={cancelCreateDevice}
                  onSave={handleSaveDeviceEdits}
                  onCreate={handleCreateDevice}
                  onClose={() => {
                    setSelectedDeviceKey(null);
                    setNewDeviceDraft(null);
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {(selectedDevice || newDeviceDraft) && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden">
          <div className="ml-auto h-full w-full max-w-md border-l border-slate-700 bg-slate-900 shadow-2xl">
            <DeviceDetailPanel
              key={newDeviceDraft ? 'mobile-new-device' : selectedDevice?.key ?? 'mobile-empty'}
              device={selectedDevice}
              newDeviceDraft={newDeviceDraft}
              canEditDatabase={canEditDatabase}
              protocolOptions={protocolOptions}
              connectivityOptions={connectivityOptions}
              tagOptions={businessTagOptions}
              saveState={saveState}
              saveMessage={saveMessage}
              onCreateDraft={startCreateDevice}
              onCancelCreate={cancelCreateDevice}
              onSave={handleSaveDeviceEdits}
              onCreate={handleCreateDevice}
              onClose={() => {
                setSelectedDeviceKey(null);
                setNewDeviceDraft(null);
              }}
            />
          </div>
        </div>
      )}

      {isAdvancedFilterOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm">
          <button type="button" aria-label="Close advanced filters" className="flex-1 cursor-default" onClick={() => setIsAdvancedFilterOpen(false)} />
          <div className="flex h-full w-full max-w-[420px] flex-col border-l border-slate-800 bg-[#08101f] p-5 shadow-[-24px_0_60px_-35px_rgba(2,6,23,0.9)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Advanced Filters</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-100">Refine the shortlist</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdvancedFilterOpen(false)}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <FilterSidebar
                filters={filters}
                options={filterOptions}
                onToggleMulti={toggleMulti}
                onToggleBoolean={toggleBoolean}
                onReset={resetFilters}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
