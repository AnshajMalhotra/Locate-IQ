export type DeviceCategory = 'gateway' | 'anchor' | 'beacon';

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
  specs: {
    bluetoothVersion: string;
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
    connectivity: ['BLE', 'Ethernet', 'PoE'],
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
    id: 'mock-beacon-1',
    key: 'beacon_m5_high_temp_tag',
    title: 'M5 High-Temp Resistant Tag',
    deviceName: 'M5 High-Temp Resistant Tag',
    modelNumber: 'M5',
    manufacturer: 'MOKO SMART',
    category: 'beacon',
    subcategory: 'High-temp BLE asset tag',
    role: 'tag / beacon',
    status: 'active',
    description: 'Industrial BLE tag built for harsh environments like steam cleaning and ultrasonic washing.',
    vendorProductUrl: 'https://www.mokosmart.com/m5-high-temp-resistant-tag/',
    datasheetPath: '\\\\192.168.0.254\\file\\02_Partners\\MOKO (BLE AoA Hardware)\\M5 High-Temp Resistant Tag Product Brief_V1.0_20230704.pdf',
    applications: ['Logistics'],
    tags: ['beacon', 'outdoor'],
    connectivity: ['BLE'],
    protocols: [{ key: 'proto_ble', name: 'BLE', direction: 'broadcast' }],
    protocolNames: ['BLE'],
    specs: {
      bluetoothVersion: 'BLE 5.0',
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
