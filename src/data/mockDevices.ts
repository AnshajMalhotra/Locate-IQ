export type DeviceCategory = 'gateway' | 'anchor' | 'beacon' | 'tag';
export type DeviceUiCategory = 'gateway' | 'anchor' | 'tag' | 'beacon';

export interface DeviceProtocol {
  key?: string;
  name: string;
  direction: string;
  details?: string;
}

export interface DeviceDocument {
  label: string;
  path: string;
}

export interface DeviceSpecs {
  bluetoothVersion?: string;
  sensors?: string[];
  batteryLifeEstimate?: string;
  wifiSupport: boolean;
  wifiBand?: string;
  ethernetSupport: boolean;
  poeSupport: boolean;
  poeStandard?: string;
  rj45Support: boolean;
  cellularSupport: boolean;
  cellularType?: string;
  gnssSupport: boolean;
  lteSupport: boolean;
  lteCategory?: string;
  ipRating?: string;
  operatingTempMinC?: number | null;
  operatingTempMaxC?: number | null;
  batteryCapacity?: string;
  replaceableBattery?: boolean;
  dimensions?: string;
  weight?: string;
  powerSupply?: string;
  installation?: string;
  material?: string;
  backhaulType?: string;
  indoorOutdoorRating?: string;
  maxSignalRangeOpenSpace?: string;
  maxSignalRangeRealWorld?: string;
}

export interface GatewayProfile {
  payloadFormat?: string;
  uplinkProtocols: string[];
  downlinkSupported: boolean;
  configurationMethod?: string;
  mqttTopicExample?: string;
  mqttPayloadExample?: string;
  httpsEndpoint?: string;
  websocketEndpoint?: string;
  edgeComputingMode?: string;
  calculatesCoordinatesLocally?: boolean;
  forwardsRawSignals?: boolean;
  supportsRefreshRateConfig?: boolean;
  supportsLedControl?: boolean;
  supportsBuzzerControl?: boolean;
  nodeRedIntegrationReady?: boolean;
  centralEngineDependency?: string;
  configurableParameters?: string;
  notes?: string;
}

export interface AnchorProfile {
  positioningTechnology?: string;
  positioningAccuracy?: string;
  installationHeight?: string;
  coverageArea?: string;
  networkProtocols?: string;
  cascadeSupported?: boolean;
  mountingMode?: string;
  syncRequirement?: string;
  recommendedAnchorSpacing?: string;
  recommendedAnchorDensity?: string;
  lineOfSightRequirement?: string;
  metalInterferenceRisk?: string;
  rawSignalForwarding?: boolean;
  positioningEngineLocation?: string;
  installationPrerequisites?: string;
  commissioningNotes?: string;
  notes?: string;
}

export interface DeviceVariant {
  id: string;
  label: string;
  chipset?: string;
  workModes: string[];
  firmwareSummary: string[];
  sensors: string[];
  notes: string[];
}

export interface Device {
  id: string;
  key: string;
  title: string;
  deviceName: string;
  modelNumber?: string;
  manufacturer: string;
  category: DeviceCategory;
  subcategory?: string;
  role?: string;
  status: string;
  description: string;
  vendorProductUrl?: string;
  datasheetPath?: string;
  applications: string[];
  tags: string[];
  connectivity: string[];
  protocols: DeviceProtocol[];
  protocolNames: string[];
  specs: DeviceSpecs;
  gatewayProfile?: GatewayProfile;
  anchorProfile?: AnchorProfile;
  variantGroup?: string;
  variants?: DeviceVariant[];
  documents: DeviceDocument[];
}

export interface DeviceOption {
  key: string;
  label: string;
}

export interface EditableProtocolLink {
  protocolKey: string;
  direction: string;
  details: string;
}

export interface DeviceSavePayload {
  key: string;
  category: DeviceCategory;
  title: string;
  manufacturer: string;
  modelNumber: string;
  subcategory: string;
  role: string;
  status: string;
  description: string;
  vendorProductUrl: string;
  datasheetPath: string;
  applications: string[];
  tags: string[];
  specs: {
    bluetoothVersion: string;
    sensors: string;
    batteryLifeEstimate: string;
    ipRating: string;
    backhaulType: string;
    powerSupply: string;
    installation: string;
    batteryCapacity: string;
    dimensions: string;
    weight: string;
  };
  connectivityKeys: string[];
  protocols: EditableProtocolLink[];
  gatewayProfile?: {
    edgeComputingMode: string;
    configurationMethod: string;
    configurableParameters: string;
    notes: string;
  };
  anchorProfile?: {
    positioningTechnology: string;
    positioningAccuracy: string;
    installationHeight: string;
    mountingMode: string;
    networkProtocols: string;
    commissioningNotes: string;
    notes: string;
  };
}

export function getDeviceUiCategory(device: Pick<Device, 'category' | 'title' | 'deviceName' | 'modelNumber' | 'subcategory' | 'role' | 'tags'>): DeviceUiCategory {
  if (device.category !== 'beacon') {
    return device.category;
  }

  const primaryIdentityText = [
    device.title,
    device.deviceName,
    device.modelNumber,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const secondaryIdentityText = [
    device.subcategory,
    device.role,
    ...device.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const primaryHasBeaconCue = /\bbeacon\b/.test(primaryIdentityText);
  const primaryHasTagCue = /\btag\b/.test(primaryIdentityText);
  const secondaryHasBeaconCue = /\bbeacon\b/.test(secondaryIdentityText);
  const secondaryHasTagCue = /\btag\b/.test(secondaryIdentityText);

  // Trust the primary naming first so explicit beacon renames in the DB
  // aren't overridden by old "tag" wording left in subcategory/role fields.
  if (primaryHasBeaconCue && !primaryHasTagCue) return 'beacon';
  if (primaryHasTagCue && !primaryHasBeaconCue) return 'tag';
  if (primaryHasBeaconCue) return 'beacon';
  if (primaryHasTagCue) return 'tag';
  if (secondaryHasBeaconCue && !secondaryHasTagCue) return 'beacon';
  if (secondaryHasTagCue && !secondaryHasBeaconCue) return 'tag';

  return 'beacon';
}

export function getDeviceUiCategoryLabel(device: Pick<Device, 'category' | 'title' | 'deviceName' | 'modelNumber' | 'subcategory' | 'role' | 'tags'>) {
  const category = getDeviceUiCategory(device);

  if (category === 'gateway') return 'Gateway';
  if (category === 'anchor') return 'Anchor';
  if (category === 'tag') return 'Tag';
  return 'Beacon';
}

function slugifyImagePart(value?: string) {
  return (value ?? '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function getDeviceImageCandidates(device: Pick<Device, 'key' | 'category' | 'title' | 'deviceName' | 'modelNumber' | 'subcategory' | 'role' | 'tags'>) {
  const uiCategory = getDeviceUiCategory(device);
  const folders = uniqStrings([
    uiCategory === 'tag' ? 'tags' : `${uiCategory}s`,
    device.category === 'beacon' ? 'beacons' : device.category === 'anchor' ? 'anchors' : device.category === 'gateway' ? 'gateways' : '',
    uiCategory === 'tag' ? 'beacons' : '',
  ]);

  const keySlug = slugifyImagePart(device.key);
  const keyWithoutPrefix = slugifyImagePart(device.key.replace(/^(gw|anchor|beacon|tag)_/, ''));
  const titleSlug = slugifyImagePart(device.title);
  const deviceNameSlug = slugifyImagePart(device.deviceName);
  const modelSlug = slugifyImagePart(device.modelNumber);

  const basenames = uniqStrings([
    keySlug,
    keyWithoutPrefix,
    titleSlug,
    deviceNameSlug,
    modelSlug,
    `${uiCategory}-${keyWithoutPrefix}`,
    `${device.category}-${keyWithoutPrefix}`,
    `${uiCategory}-${titleSlug}`,
    `${device.category}-${titleSlug}`,
  ]);

  const extensions = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
  const candidates = [];
  const nestedFolderNames = uniqStrings([
    keyWithoutPrefix,
    modelSlug,
    titleSlug,
    deviceNameSlug,
    keySlug,
  ]);
  const nestedBasenames = uniqStrings([
    'product',
    'cover',
    'device',
    ...basenames,
  ]);

  for (const folder of folders) {
    for (const basename of basenames) {
      for (const extension of extensions) {
        candidates.push(`/device-images/${folder}/${basename}.${extension}`);
      }
    }

    for (const nestedFolder of nestedFolderNames) {
      for (const nestedBasename of nestedBasenames) {
        for (const extension of extensions) {
          candidates.push(`/device-images/${folder}/${nestedFolder}/${nestedBasename}.${extension}`);
        }
      }
    }
  }

  candidates.push('/device-images/placeholders/device-placeholder.svg');
  return uniqStrings(candidates);
}

export const mockDevices: Device[] = [
  {
    id: 'mock-gw-1',
    key: 'gw_mkgw4',
    title: 'MKGW4',
    deviceName: 'MKGW4',
    modelNumber: 'MKGW4',
    manufacturer: 'MOKO SMART',
    category: 'gateway',
    subcategory: 'BLE to Cellular Gateway',
    role: 'uplink bridge',
    status: 'active',
    description: 'Outdoor BLE gateway with cellular backhaul, GNSS support, and MQTT-based remote configuration.',
    vendorProductUrl: 'https://www.mokosmart.com/mkgw4-outdoor-cellular-gateway/',
    datasheetPath: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\Gateways\\MKGW4\\MKGW4 Configuration APP User Manual V1.0.pdf',
    applications: ['Logistics', 'Warehouse Tracking'],
    tags: ['gateway', 'cellular', 'outdoor'],
    connectivity: ['BLE', 'Cellular', 'GNSS'],
    protocols: [
      { key: 'proto_mqtt', name: 'MQTT', direction: 'uplink/downlink' },
    ],
    protocolNames: ['MQTT'],
    specs: {
      bluetoothVersion: 'BLE 5.0',
      wifiSupport: false,
      ethernetSupport: false,
      poeSupport: false,
      rj45Support: false,
      cellularSupport: true,
      cellularType: 'LTE Cat 1 / GSM',
      gnssSupport: true,
      lteSupport: true,
      lteCategory: 'LTE Cat 1',
      ipRating: 'IP67',
      operatingTempMinC: -30,
      operatingTempMaxC: 70,
      batteryCapacity: '3000mAh backup battery',
      batteryLifeEstimate: 'Externally powered with 3000mAh backup battery',
      backhaulType: 'Cellular (CAT.1 / GSM) with GNSS / LBS support',
      indoorOutdoorRating: 'Outdoor (IP67)',
      installation: 'Hard-wired outdoor mounting',
      maxSignalRangeRealWorld: 'Positioning depends on cellular coverage and GNSS visibility.',
    },
    gatewayProfile: {
      payloadFormat: 'Hex',
      uplinkProtocols: ['MQTT'],
      downlinkSupported: true,
      configurationMethod: 'Bluetooth APP / MQTT remote config',
      mqttTopicExample: '/MKGW4/<gateway-mac>/send',
      edgeComputingMode: 'hybrid',
      calculatesCoordinatesLocally: false,
      forwardsRawSignals: true,
      supportsRefreshRateConfig: true,
      supportsLedControl: false,
      supportsBuzzerControl: false,
      nodeRedIntegrationReady: true,
      centralEngineDependency: 'Application logic stays upstream in the platform layer.',
      configurableParameters: 'Network settings, MQTT settings, BLE scan/report parameters, positioning parameters.',
      notes: 'Strong fit when clients need outdoor backhaul without Ethernet.',
    },
    documents: [
      { label: 'Configuration Manual', path: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\Gateways\\MKGW4\\MKGW4 Configuration APP User Manual V1.0.pdf' },
    ],
  },
  {
    id: 'mock-anchor-1',
    key: 'anchor_mkbal_c25_p',
    title: 'MKBAL-C25-P AoA Locator',
    deviceName: 'MKBAL-C25-P',
    modelNumber: 'MKBAL-C25-P',
    manufacturer: 'MOKO SMART',
    category: 'anchor',
    subcategory: 'AoA locator',
    role: 'positioning infrastructure',
    status: 'active',
    description: 'Ceiling-mounted AoA locator with Ethernet and PoE, designed for high-accuracy indoor positioning.',
    vendorProductUrl: 'https://www.mokosmart.com/bluetooth-beacons/',
    datasheetPath: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\AOA products\\AoA Locator\\MKBAL-C25-P AoA Locator Specification_V1.1_20230720.pdf',
    applications: ['Warehouse Tracking', 'Indoor Navigation', 'Healthcare'],
    tags: ['anchor', 'ethernet', 'poe'],
    connectivity: ['BLE', 'Ethernet / PoE'],
    protocols: [
      { key: 'proto_mqtt', name: 'MQTT', direction: 'uplink' },
      { key: 'proto_http', name: 'HTTP', direction: 'uplink' },
      { key: 'proto_udp', name: 'UDP', direction: 'uplink' },
    ],
    protocolNames: ['MQTT', 'HTTP', 'UDP'],
    specs: {
      bluetoothVersion: 'Bluetooth 5.1 / 4.2',
      wifiSupport: false,
      ethernetSupport: true,
      poeSupport: true,
      poeStandard: '802.3af PoE 48V with PoE in / PoE out cascade',
      rj45Support: true,
      cellularSupport: false,
      gnssSupport: false,
      lteSupport: false,
      ipRating: 'IP66',
      operatingTempMinC: -20,
      operatingTempMaxC: 60,
      dimensions: '180.7 x 180.7 x 40.7 mm',
      weight: '582g',
      powerSupply: 'PoE 48V or DC 12-30V',
      batteryLifeEstimate: 'Externally powered',
      installation: 'Ceiling mount',
      material: 'ABS+PC',
      backhaulType: 'Ethernet',
      indoorOutdoorRating: 'IP66 rugged locator',
      maxSignalRangeOpenSpace: 'AoA coverage up to 500m2 open area',
      maxSignalRangeRealWorld: 'Coverage and accuracy depend on ceiling height and obstructions.',
    },
    anchorProfile: {
      positioningTechnology: 'BLE AoA',
      positioningAccuracy: '0.1m ~ 1m',
      installationHeight: 'Up to 10m',
      coverageArea: 'Up to 500m2 open area',
      networkProtocols: 'MQTT / HTTP / WebSocket / UDP',
      cascadeSupported: true,
      mountingMode: 'Ceiling',
      syncRequirement: 'Requires CLE / CCS backend.',
      recommendedAnchorSpacing: '<=10m network cable between cascaded locators',
      recommendedAnchorDensity: 'Depends on target accuracy and floor geometry.',
      lineOfSightRequirement: 'Open ceiling deployment preferred.',
      rawSignalForwarding: true,
      positioningEngineLocation: 'CLE Server',
      installationPrerequisites: 'PoE/DC power, ceiling mount, backend commissioning.',
      commissioningNotes: 'Respect cascade distance and backend calibration.',
      notes: 'Best suited for deterministic indoor RTLS deployments.',
    },
    documents: [
      { label: 'AoA Locator Specification', path: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\AOA products\\AoA Locator\\MKBAL-C25-P AoA Locator Specification_V1.1_20230720.pdf' },
    ],
  },
  {
    id: 'mock-beacon-2',
    key: 'tag_m2_multi_variant_tag',
    title: 'M2 Multi-Variant Tag',
    deviceName: 'M2 Tag',
    modelNumber: 'M2',
    manufacturer: 'MOKO SMART',
    category: 'tag',
    subcategory: 'BLE RTLS asset tag',
    role: 'asset tag',
    status: 'active',
    description: 'BLE tag family with multiple chipset variants that support different positioning modes, firmware tracks, and sensor combinations.',
    vendorProductUrl: 'https://www.mokosmart.com/',
    applications: ['Warehouse Tracking', 'Healthcare', 'Indoor Navigation'],
    tags: ['tag', 'variant-family', 'rtls'],
    connectivity: ['BLE'],
    protocols: [{ key: 'proto_ble', name: 'BLE', direction: 'broadcast' }],
    protocolNames: ['BLE'],
    specs: {
      bluetoothVersion: 'BLE 5.1+',
      sensors: ['3-axis accelerometer', 'temperature sensor', 'humidity sensor', 'hall-effect sensor'],
      batteryLifeEstimate: '3 years with motion detection',
      wifiSupport: false,
      ethernetSupport: false,
      poeSupport: false,
      rj45Support: false,
      cellularSupport: false,
      gnssSupport: false,
      lteSupport: false,
      ipRating: 'IP67',
      batteryCapacity: 'Coin cell / SKU dependent',
      installation: 'Portable tag / badge / asset mount',
      indoorOutdoorRating: 'Indoor RTLS tag family',
      maxSignalRangeOpenSpace: 'Variant dependent',
      maxSignalRangeRealWorld: 'Depends on antenna design, layout, and positioning mode.',
    },
    variantGroup: 'M2 Tag Family',
    variants: [
      {
        id: 'm2_nordic_52810',
        label: 'M2 (Nordic 52810)',
        chipset: 'Nordic 52810',
        workModes: ['BLE AoA', 'BLE RSSI'],
        firmwareSummary: ['BLE firmware AoA: BXP-A-C', 'BLE firmware RSSI: BXP-D'],
        sensors: ['3-axis accelerometer'],
        notes: ['Standard variant for BLE AoA tag'],
      },
      {
        id: 'm2_nordic_52805',
        label: 'M2 (Nordic 52805)',
        chipset: 'Nordic 52805',
        workModes: ['BLE AoA', 'BLE RSSI'],
        firmwareSummary: ['BLE firmware AoA: BXP-A-C', 'BLE firmware RSSI: BXP-DH'],
        sensors: ['3-axis accelerometer'],
        notes: [],
      },
      {
        id: 'm2_nordic_52832',
        label: 'M2 (Nordic 52832)',
        chipset: 'Nordic 52832',
        workModes: ['BLE RSSI'],
        firmwareSummary: [],
        sensors: ['3-axis accelerometer', 'temperature'],
        notes: [],
      },
      {
        id: 'm2_efr32bg22',
        label: 'M2 (EFR32BG22)',
        chipset: 'EFR32BG22',
        workModes: ['BLE AoA (for Quuppa)'],
        firmwareSummary: ['BLE firmware: Quuppa v3'],
        sensors: [],
        notes: ['Variant for BLE AoA'],
      },
    ],
    documents: [],
  },
  {
    id: 'mock-beacon-1',
    key: 'tag_m5_high_temp_tag',
    title: 'M5 High-Temp Resistant Tag',
    deviceName: 'M5 High-Temp Resistant Tag',
    modelNumber: 'M5',
    manufacturer: 'MOKO SMART',
    category: 'tag',
    subcategory: 'High-temp BLE asset tag',
    role: 'high-temperature asset tag',
    status: 'active',
    description: 'Industrial BLE tag built for harsh environments like steam cleaning and ultrasonic washing.',
    vendorProductUrl: 'https://www.mokosmart.com/m5-high-temp-resistant-tag/',
    datasheetPath: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\M5 High-Temp Resistant Tag Product Brief_V1.0_20230704.pdf',
    applications: ['Logistics'],
    tags: ['tag', 'outdoor'],
    connectivity: ['BLE'],
    protocols: [{ key: 'proto_ble', name: 'BLE', direction: 'broadcast' }],
    protocolNames: ['BLE'],
    specs: {
      bluetoothVersion: 'BLE 5.0',
      sensors: ['accelerometer', 'temperature sensor', 'hall switch'],
      wifiSupport: false,
      ethernetSupport: false,
      poeSupport: false,
      rj45Support: false,
      cellularSupport: false,
      gnssSupport: false,
      lteSupport: false,
      ipRating: 'IP68',
      operatingTempMinC: -25,
      operatingTempMaxC: 135,
      batteryCapacity: 'Industrial CR2450 | 550mAh',
      batteryLifeEstimate: '3 years',
      replaceableBattery: false,
      dimensions: '60.3 x 32.2 x 12.0 mm',
      weight: '25g',
      installation: 'Zip tie',
      material: 'PPSU',
      indoorOutdoorRating: 'Rugged waterproof / industrial high-temperature tag (IP68)',
      maxSignalRangeOpenSpace: '150m',
      maxSignalRangeRealWorld: 'Industrial layouts and metal reduce performance.',
    },
    documents: [
      { label: 'Product Brief', path: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\M5 High-Temp Resistant Tag Product Brief_V1.0_20230704.pdf' },
    ],
  },
];
