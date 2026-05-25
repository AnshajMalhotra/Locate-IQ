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

const PORTFOLIO_DOC_PATH = '/docs/portfolio/Moko-Beacon-Product-Summary_V3.4_20251223.pdf';
const PORTFOLIO_SOURCE = 'Moko Beacon Product Summary V3.4 (2025-12-23)';
const BLE_BACKHAUL = 'None (BLE broadcast / scanned by anchors, gateways, or mobile apps)';

function makeProduct({
  key,
  title,
  model,
  category,
  subcategory,
  role,
  bluetooth,
  dimensions,
  ip,
  installation,
  sensors,
  batteryCapacity,
  replaceableBattery,
  batteryLife,
  operatingTemp,
  applicationKeys,
  businessTags = [],
  docPath = PORTFOLIO_DOC_PATH,
  vendorUrl = '',
}) {
  return {
    key,
    title,
    model,
    category,
    subcategory,
    role,
    bluetooth,
    dimensions,
    ip,
    installation,
    sensors,
    batteryCapacity,
    replaceableBattery,
    batteryLife,
    operatingTemp,
    applicationKeys,
    businessTags,
    docPath,
    vendorUrl,
  };
}

const PRODUCTS = [
  makeProduct({
    key: 'tag_m1_coin_tag',
    title: 'M1 Coin Tag',
    model: 'M1',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'coin asset tag',
    bluetooth: 'BLE 5.0',
    dimensions: 'Phi 26.0*7.1 mm',
    ip: 'Not rated',
    installation: '3M tape',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
  }),
  makeProduct({
    key: 'tag_m1p_led_tag',
    title: 'M1P LED Tag',
    model: 'M1P',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'LED asset tag',
    bluetooth: 'BLE 5.0',
    dimensions: 'Phi 30.0*8.0 mm',
    ip: 'Not rated',
    installation: '3M tape',
    sensors: ['3-axis accelerometer', 'temperature sensor (optional)'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
    docPath: '/docs/tags/m1p/M1P-LED-Tag-Brief.pdf',
    vendorUrl: 'https://www.mokosmart.com/m1p-led-tag/',
  }),
  makeProduct({
    key: 'tag_m2_multi_variant_tag',
    title: 'M2 Asset Tag',
    model: 'M2',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'asset tag',
    bluetooth: 'BLE 5.0',
    dimensions: '70.0*46.0*21.0 mm',
    ip: 'IP67',
    installation: 'Screw / 3M tape / Zip tie',
    sensors: ['3-axis accelerometer', 'temperature sensor (optional)', 'door detection (optional)'],
    batteryCapacity: '1000mAh',
    replaceableBattery: true,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
  }),
  makeProduct({
    key: 'tag_m3m_industrial_tag',
    title: 'M3M Industrial Tag',
    model: 'M3M',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'industrial asset tag',
    bluetooth: 'BLE 5.0',
    dimensions: '94.6*51.7*22.8 mm',
    ip: 'IP67/IK08',
    installation: 'Screw / Magnetic',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '2600mAh',
    replaceableBattery: true,
    batteryLife: '8+ years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
    businessTags: ['outdoor'],
  }),
  makeProduct({
    key: 'tag_m4_lite_tag',
    title: 'M4 Lite Tag',
    model: 'M4',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'asset tag',
    bluetooth: 'BLE 5.1',
    dimensions: '36.5*23.5*5.2 mm',
    ip: 'Not rated',
    installation: '3M tape / Zip tie',
    sensors: ['3-axis accelerometer', 'temperature sensor (optional)'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
  }),
  makeProduct({
    key: 'tag_m4_pro_waterproof_tag',
    title: 'M4 Pro Waterproof Tag',
    model: 'M4 Pro',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'waterproof asset tag',
    bluetooth: 'BLE 5.1',
    dimensions: '42.0*26.0*6.0 mm',
    ip: 'IP67',
    installation: '3M tape / Zip tie',
    sensors: ['3-axis accelerometer', 'temperature sensor (optional)'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
    businessTags: ['outdoor'],
  }),
  makeProduct({
    key: 'tag_m4pb_asset_button_tag',
    title: 'M4PB Asset Button Tag',
    model: 'M4PB',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'asset button tag',
    bluetooth: 'BLE 5.0',
    dimensions: '43.3*26.0*6.9 mm',
    ip: 'IP67',
    installation: '3M tape / Zip tie',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
    businessTags: ['outdoor'],
  }),
  makeProduct({
    key: 'tag_m5_high_temp_tag',
    title: 'M5 High-Temp Resistance Tag',
    model: 'M5',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'high-temperature asset tag',
    bluetooth: 'BLE 5.1',
    dimensions: '64.9*32.5*13.0 mm',
    ip: 'IP68/IP69K/IK07',
    installation: 'Screw | Zip tie',
    sensors: ['3-axis accelerometer', 'temperature sensor (optional)'],
    batteryCapacity: '600mAh',
    replaceableBattery: false,
    batteryLife: '3 years',
    operatingTemp: '-20°C / +100°C',
    applicationKeys: ['app_asset_tracking'],
    businessTags: ['outdoor'],
    docPath: '/docs/tags/m5/M5-High-Temp-Resistant-Tag-Brief_V1.2.pdf',
    vendorUrl: 'https://www.mokosmart.com/m5-high-temp-resistant-tag/',
  }),
  makeProduct({
    key: 'tag_m6_industry_tag',
    title: 'M6 Industry Tag',
    model: 'M6',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'industrial asset tag',
    bluetooth: 'BLE 5.1',
    dimensions: '97.0*53.5*28.0 mm',
    ip: 'IP67/IK08',
    installation: 'Screw | Sticker | Zip Tie',
    sensors: ['3-axis accelerometer', 'temperature sensor (optional)'],
    batteryCapacity: '5200mAh (Li-SOCI2) | 3200mAh (Alkaline)',
    replaceableBattery: true,
    batteryLife: '10+ years (Li-SOCI2) | 5 years (Alkaline)',
    operatingTemp: '-20°C / +60°C (Li-SOCI2) | 0°C / +40°C (Alkaline)',
    applicationKeys: ['app_asset_tracking'],
    businessTags: ['outdoor'],
  }),
  makeProduct({
    key: 'tag_m7_anti_tamper_tag',
    title: 'M7 Anti-Tamper Tag',
    model: 'M7',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'anti-tamper asset tag',
    bluetooth: 'BLE 5.0',
    dimensions: '53.3*33.3*5.0 mm (CR2032 version) | 57.3*37.3*6.8 mm (CR2450 version)',
    ip: 'IP67',
    installation: 'Magnetic mounting sticker',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '220mAh (CR2032 version) | 600mAh (CR2450 version)',
    replaceableBattery: false,
    batteryLife: '1.5 years (CR2032 version) | 3 years (CR2450 version)',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
    businessTags: ['outdoor'],
  }),
  makeProduct({
    key: 'tag_m8_compact_rugged_asset_tag',
    title: 'M8 Compact Rugged Asset Tag',
    model: 'M8',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'rugged asset tag',
    bluetooth: 'BLE 5.0',
    dimensions: 'M8: 60.0*39.2*14.7 mm | M8A: Phi 38.0*13.5 mm',
    ip: 'IP68/IP69K/IK06',
    installation: 'Screw | Sticker',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '600mAh',
    replaceableBattery: true,
    batteryLife: '3 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
    businessTags: ['outdoor'],
  }),
  makeProduct({
    key: 'tag_m9_rugged_asset_tag',
    title: 'M9 Rugged Asset Tag',
    model: 'M9',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'rugged asset tag',
    bluetooth: 'BLE 5.0',
    dimensions: 'M9: 60.0*39.2*17.2 mm | M9A: Phi 38.0*16.0 mm',
    ip: 'IP68/IK06',
    installation: 'Screw | Sticker',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '1000mAh',
    replaceableBattery: true,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
    businessTags: ['outdoor'],
  }),
  makeProduct({
    key: 'tag_n1_stamp',
    title: 'N1 Stamp',
    model: 'N1',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'stamp asset tag',
    bluetooth: 'BLE 5.1',
    dimensions: '36.5*23.5*4.7 mm',
    ip: 'Not rated',
    installation: '3M tape',
    sensors: ['temperature sensor (optional)'],
    batteryCapacity: '85mAh',
    replaceableBattery: true,
    batteryLife: '17 months',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
  }),
  makeProduct({
    key: 'tag_n2_soft_foam_asset_tag',
    title: 'N2 Soft-foam Asset Tag',
    model: 'N2',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'soft-foam asset tag',
    bluetooth: 'BLE 5.1',
    dimensions: '51.0*30.5*3.0 mm',
    ip: 'IP67',
    installation: '3M tape',
    sensors: [],
    batteryCapacity: '85mAh',
    replaceableBattery: false,
    batteryLife: '14 months',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_asset_tracking'],
  }),
  makeProduct({
    key: 'tag_ut1_ultra_thin_paper_tag',
    title: 'UT1 Ultra-thin Paper Tag',
    model: 'UT1',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'paper asset tag',
    bluetooth: 'BLE 5.1',
    dimensions: '73.3*65.0*2.3 mm (UT1) | 73.3*83.5*1.2 mm (UT1P)',
    ip: 'Not rated',
    installation: 'Sticker',
    sensors: [],
    batteryCapacity: '40mAh',
    replaceableBattery: false,
    batteryLife: '3 months',
    operatingTemp: '-20°C / +55°C',
    applicationKeys: ['app_asset_tracking'],
  }),
  makeProduct({
    key: 'tag_ut3_printable_asset_label',
    title: 'UT3 Printable Asset Label',
    model: 'UT3',
    category: 'tag',
    subcategory: 'Asset Tag',
    role: 'printable asset label',
    bluetooth: 'BLE 5.1',
    dimensions: '160.0*100.0*1.2 mm',
    ip: 'Not rated',
    installation: 'Sticker',
    sensors: [],
    batteryCapacity: '40mAh',
    replaceableBattery: false,
    batteryLife: '3 months',
    operatingTemp: '-20°C / +55°C',
    applicationKeys: ['app_asset_tracking'],
  }),
  makeProduct({
    key: 'tag_h1_keychain',
    title: 'H1 Keychain',
    model: 'H1',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'personnel keychain tag',
    bluetooth: 'BLE 5.0',
    dimensions: '32.5*32.5*7.0 mm',
    ip: 'IP65',
    installation: 'Lanyard / Zip tie',
    sensors: ['3-axis accelerometer', 'buzzer (optional)'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_h3_card',
    title: 'H3 Card',
    model: 'H3',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'personnel card tag',
    bluetooth: 'BLE 5.0',
    dimensions: '85.6*54.1*5.2 mm',
    ip: 'IP66',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer', 'RFID / NFC'],
    batteryCapacity: '800mAh',
    replaceableBattery: false,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_h3_pro_button',
    title: 'H3 Pro Button',
    model: 'H3 Pro',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'personnel panic button badge',
    bluetooth: 'BLE 5.0',
    dimensions: '89.0*57.0*5.9 mm',
    ip: 'IP66',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer', 'RFID / NFC', 'buzzer'],
    batteryCapacity: '800mAh',
    replaceableBattery: false,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_h5_pro_rfid_badge',
    title: 'H5 Pro RFID Badge',
    model: 'H5 Pro',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'RFID personnel badge',
    bluetooth: 'BLE 5.0',
    dimensions: '68.0*50.0*6.3 mm',
    ip: 'IP66',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer', 'RFID / NFC'],
    batteryCapacity: '550mAh',
    replaceableBattery: true,
    batteryLife: '3 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_h5pd_dual_panic_button',
    title: 'H5PD Dual Panic Button',
    model: 'H5PD',
    category: 'tag',
    subcategory: 'Emergency Button',
    role: 'dual panic button tag',
    bluetooth: 'BLE 5.0',
    dimensions: '68.0*50.0*6.6 mm',
    ip: 'IP65',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer', 'RFID / NFC', 'buzzer'],
    batteryCapacity: '550mAh',
    replaceableBattery: true,
    batteryLife: '3 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_h7_helmet_tag',
    title: 'H7 Helmet Tag',
    model: 'H7',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'helmet safety tag',
    bluetooth: 'BLE 5.0',
    dimensions: '57.4*41.4*18.7 mm',
    ip: 'IP67',
    installation: '3M tape / Velcro (in helmet)',
    sensors: ['3-axis accelerometer', 'RFID / NFC (optional)', 'buzzer'],
    batteryCapacity: '550mAh',
    replaceableBattery: true,
    batteryLife: '3 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_h7_lite_helmet_tag',
    title: 'H7 Lite Helmet Tag',
    model: 'H7 Lite',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'helmet safety tag',
    bluetooth: 'BLE 5.0',
    dimensions: '42.6*25.2*8.3 mm',
    ip: 'IP67',
    installation: '3M tape (in helmet)',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '220mAh',
    replaceableBattery: false,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_h8_identification_tag',
    title: 'H8 Identification Tag',
    model: 'H8',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'identification tag',
    bluetooth: 'BLE 5.0',
    dimensions: '56.0*36.0*7.3 mm',
    ip: 'IP65',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer', 'buzzer (optional)'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '15 months',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_h8c_rechargeable_tag',
    title: 'H8C Rechargeable Tag',
    model: 'H8C',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'rechargeable identification tag',
    bluetooth: 'BLE 5.0',
    dimensions: '56.0*36.0*7.7 mm',
    ip: 'IP67',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '80mAh rechargeable',
    replaceableBattery: false,
    batteryLife: '4 months per charge',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_b1_panic_button',
    title: 'B1 Panic Button',
    model: 'B1',
    category: 'tag',
    subcategory: 'Emergency Button',
    role: 'panic button tag',
    bluetooth: 'BLE 5.0',
    dimensions: '73.1*40.6*16.9 mm',
    ip: 'IP65',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer', 'buzzer', 'vibration motor'],
    batteryCapacity: '500mAh rechargeable',
    replaceableBattery: false,
    batteryLife: '6 months per charge',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_b2_smart_badge',
    title: 'B2 Smart Badge',
    model: 'B2',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'smart badge',
    bluetooth: 'BLE 5.0',
    dimensions: '98.0*65.2*8.5 mm',
    ip: 'IP66',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer', 'RFID / NFC', 'buzzer'],
    batteryCapacity: '800mAh',
    replaceableBattery: false,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_b2r_smart_badge',
    title: 'B2R Smart Badge',
    model: 'B2R',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'smart badge',
    bluetooth: 'BLE 5.0',
    dimensions: '98.0*65.2*8.6 mm',
    ip: 'IP66',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer', 'RFID / NFC', 'buzzer'],
    batteryCapacity: '880mAh',
    replaceableBattery: true,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_b3_emergency_button',
    title: 'B3 Emergency Button',
    model: 'B3',
    category: 'tag',
    subcategory: 'Emergency Button',
    role: 'emergency button',
    bluetooth: 'BLE 5.0',
    dimensions: 'Phi 48.0*15.3 mm',
    ip: 'Not rated',
    installation: '3M tape / Lanyard',
    sensors: ['3-axis accelerometer', 'buzzer (optional)'],
    batteryCapacity: '600mAh',
    replaceableBattery: true,
    batteryLife: '3 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_b5_rechargeable_badge',
    title: 'B5 Rechargeable Badge',
    model: 'B5',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'rechargeable badge',
    bluetooth: 'BLE 5.0',
    dimensions: '91.0*59.0*7.5 mm',
    ip: 'IP66',
    installation: 'Lanyard',
    sensors: ['3-axis accelerometer', 'buzzer', 'vibration motor'],
    batteryCapacity: '350mAh rechargeable',
    replaceableBattery: false,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_w3b_essential_key_fob',
    title: 'W3B Essential Key-fob',
    model: 'W3B',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'key-fob tag',
    bluetooth: 'BLE 5.0',
    dimensions: '40.4*29.0*8.6 mm',
    ip: 'Not rated',
    installation: 'Lanyard / Strap',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_w3_pro_smart_guard_wristband',
    title: 'W3 Pro Smart-Guard Wristband',
    model: 'W3 Pro',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'wristband tag',
    bluetooth: 'BLE 5.0',
    dimensions: '40.0*32.0*10.3 mm',
    ip: 'IP67',
    installation: 'Lanyard / Strap',
    sensors: ['3-axis accelerometer'],
    batteryCapacity: '220mAh',
    replaceableBattery: false,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_w6_wristband_tag',
    title: 'W6/W6B Wristband Tag',
    model: 'W6/W6B',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'wristband tag',
    bluetooth: 'BLE 5.0',
    dimensions: 'Phi 38.6*10.5 mm (W6 body) | Phi 38.6*10.8 mm (W6B body) | 198*39.6 mm (strap)',
    ip: 'IP67',
    installation: 'Lanyard / Strap',
    sensors: ['3-axis accelerometer', 'RFID / NFC (W6 only)'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '5 months',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'tag_w7_medical_wristband',
    title: 'W7 Medical Wristband',
    model: 'W7',
    category: 'tag',
    subcategory: 'Personnel Tag',
    role: 'medical wristband tag',
    bluetooth: 'BLE 5.0',
    dimensions: '250*24.5*4.5 mm (adult) | 205*24.5*4.5 mm (kid) | 160*24.5*4.5 mm (infant)',
    ip: 'IP67',
    installation: 'Strap',
    sensors: ['RFID / NFC'],
    batteryCapacity: '38mAh',
    replaceableBattery: false,
    batteryLife: '',
    operatingTemp: '-25°C / +55°C',
    applicationKeys: ['app_personnel_tracking'],
  }),
  makeProduct({
    key: 'beacon_s01p_pir_presence_sensor',
    title: 'S01P PIR Presence Sensor',
    model: 'S01P',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'presence sensor beacon',
    bluetooth: 'BLE 5.0',
    dimensions: '74.2*32.8*46.9 mm',
    ip: 'Not rated',
    installation: '3M tape / Bracket',
    sensors: ['passive IR sensor', 'door detection sensor'],
    batteryCapacity: '5200mAh',
    replaceableBattery: true,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
  }),
  makeProduct({
    key: 'beacon_s02r_tof_range_sensor',
    title: 'S02R ToF Range Sensor',
    model: 'S02R',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'range sensor beacon',
    bluetooth: 'BLE 5.0',
    dimensions: 'Phi 38.0*14.5 mm',
    ip: 'IP67',
    installation: '3M tape',
    sensors: ['ToF range sensor'],
    batteryCapacity: '600mAh',
    replaceableBattery: true,
    batteryLife: '3 years - short ranging mode (<1m) | 1 year - long ranging mode (1m-3m)',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
  }),
  makeProduct({
    key: 'beacon_s03d_door_monitoring_sensor',
    title: 'S03D Door Sensor',
    model: 'S03D',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'door monitoring sensor beacon',
    bluetooth: 'BLE 5.0',
    dimensions: '77.5*27.0*24.7 mm (body) | 40.0*16.0*15.0 mm (magnet)',
    ip: 'IPX4',
    installation: '3M tape / Bracket',
    sensors: ['hall-effect sensor'],
    batteryCapacity: '2600mAh',
    replaceableBattery: true,
    batteryLife: '8 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
    docPath: '/docs/beacons/S03D/S03D-Door-Sensor-Product-Brief_V2.1.pdf',
    vendorUrl: 'https://www.mokosmart.com/bluetooth-door-sensor/',
  }),
  makeProduct({
    key: 'beacon_s05t_asset_temperature_logger',
    title: 'S05T Asset Temperature Logger',
    model: 'S05T',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'temperature logger beacon',
    bluetooth: 'BLE 5.1',
    dimensions: '49.6*28.8*4.7 mm',
    ip: 'IP67',
    installation: '3M tape',
    sensors: ['temperature sensor'],
    batteryCapacity: '220mAh',
    replaceableBattery: false,
    batteryLife: '2 years',
    operatingTemp: '-30°C / +60°C',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
  }),
  makeProduct({
    key: 'beacon_h4_temp_humidity_sensor',
    title: 'H4 Temperature & Humidity Sensor',
    model: 'H4',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'temperature and humidity sensor beacon',
    bluetooth: 'BLE 5.0',
    dimensions: '70.0*32.2*18.2 mm',
    ip: 'IPX4',
    installation: '3M tape',
    sensors: ['temperature sensor', 'humidity sensor', 'barometric pressure sensor (optional)'],
    batteryCapacity: '1200mAh',
    replaceableBattery: true,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
    docPath: '/docs/beacons/h4/H4-Series-Product-Brief_20250619.pdf',
    vendorUrl: 'https://www.mokosmart.com/mokosmart-h4-beacon-temperature-humidity-sensor-supporting-ble5-0/',
  }),
  makeProduct({
    key: 'beacon_h4_pro_temp_humidity_sensor',
    title: 'H4 Pro Temperature & Humidity Sensor',
    model: 'H4 Pro',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'temperature and humidity sensor beacon',
    bluetooth: 'BLE 5.0',
    dimensions: '88.0*32.2*18.2 mm | Phi 3*1000 mm (probe)',
    ip: 'IPX4',
    installation: '3M tape',
    sensors: ['temperature sensor', 'humidity sensor', 'barometric pressure sensor (optional)'],
    batteryCapacity: '1200mAh',
    replaceableBattery: true,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C (body) | -40°C / +125°C (probe)',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
    docPath: '/docs/beacons/h4/H4-Series-Product-Brief_20250619.pdf',
    vendorUrl: 'https://store.mokosmart.com/product/h4-pro-temperature-humidity-sensor/',
  }),
  makeProduct({
    key: 'beacon_water_leakage_probe',
    title: 'Water Leakage Probe',
    model: 'Water Leakage Probe',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'water leakage sensor beacon',
    bluetooth: 'BLE 5.0',
    dimensions: '122.6*72.9*33.8 mm (body) | 1 meter probe',
    ip: 'IP67',
    installation: '3M tape',
    sensors: ['water leakage sensor'],
    batteryCapacity: '8000mAh',
    replaceableBattery: true,
    batteryLife: '10+ years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
  }),
  makeProduct({
    key: 'beacon_pt100_temperature_probe',
    title: 'PT100 Temperature Probe',
    model: 'PT100',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'probe temperature sensor beacon',
    bluetooth: 'BLE 5.0',
    dimensions: '122.6*72.9*33.8 mm (body) | 1 meter probe',
    ip: 'IP67',
    installation: '3M tape',
    sensors: ['PT100 temperature sensor'],
    batteryCapacity: '8000mAh',
    replaceableBattery: true,
    batteryLife: '10+ years',
    operatingTemp: '-20°C / +60°C (body) | -100°C / +100°C (probe)',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
  }),
  makeProduct({
    key: 'beacon_l02s_multiple_sensor',
    title: 'L02S Multiple Sensor',
    model: 'L02S',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'multi-sensor beacon',
    bluetooth: 'BLE 5.1',
    dimensions: '69.9*46.7*18.0 mm',
    ip: 'IP67',
    installation: 'Screw / 3M tape / Zip tie / Magnetic mounting',
    sensors: ['temperature sensor', 'humidity sensor', 'door detection sensor'],
    batteryCapacity: '1000mAh',
    replaceableBattery: true,
    batteryLife: '5 years',
    operatingTemp: '-20°C / +60°C | -30°C / +80°C (customizable)',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
  }),
  makeProduct({
    key: 'beacon_m4_pro_temperature_logger',
    title: 'M4 Pro Temperature Logger',
    model: 'M4 Pro Temperature Logger',
    category: 'beacon',
    subcategory: 'Sensor Beacon',
    role: 'temperature logger beacon',
    bluetooth: 'BLE 5.1',
    dimensions: '42.0*26.0*6.0 mm',
    ip: 'IP67',
    installation: '3M tape / Zip tie',
    sensors: ['temperature sensor'],
    batteryCapacity: '220mAh',
    replaceableBattery: true,
    batteryLife: '1.5 years',
    operatingTemp: '-20°C / +60°C',
    applicationKeys: ['app_condition_monitoring', 'app_environmental_monitoring'],
    businessTags: ['beacon', 'sensor'],
  }),
];

const APPLICATIONS = [
  {
    key: 'app_asset_tracking',
    name: 'Asset Tracking',
    description: 'Asset and inventory tracking use cases.',
  },
  {
    key: 'app_personnel_tracking',
    name: 'Personnel Tracking',
    description: 'Wearable tag, badge, and personnel safety use cases.',
  },
  {
    key: 'app_condition_monitoring',
    name: 'Condition Monitoring',
    description: 'Condition and event monitoring use cases for BLE sensor beacons.',
  },
];

const BUSINESS_TAGS = [
  {
    key: 'tag_beacon',
    name: 'beacon',
    description: 'Beacon class device.',
  },
  {
    key: 'tag_sensor',
    name: 'sensor',
    description: 'Sensor-focused BLE device for telemetry and monitoring.',
  },
  {
    key: 'tag_outdoor',
    name: 'outdoor',
    description: 'Suitable for rugged or outdoor-capable deployments.',
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

function coalesceString(nextValue, currentValue) {
  const normalizedNext = typeof nextValue === 'string' ? nextValue.trim() : '';
  if (normalizedNext) return normalizedNext;
  return typeof currentValue === 'string' ? currentValue : '';
}

function parseOperatingRange(value) {
  if (!value) return { min: undefined, max: undefined };
  const matches = [...value.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (!matches.length) return { min: undefined, max: undefined };
  return {
    min: Math.min(...matches),
    max: Math.max(...matches),
  };
}

function buildPowerSupply(product) {
  if (!product.batteryCapacity) return '';
  if (/usb power/i.test(product.batteryCapacity)) return 'USB power';
  if (/rechargeable/i.test(product.batteryCapacity) || /per charge/i.test(product.batteryLife)) {
    return `Rechargeable battery | ${product.batteryCapacity}`;
  }
  return `Battery | ${product.batteryCapacity}`;
}

function normalizeIp(ip) {
  if (!ip || ip === 'Not rated' || ip === '-' || ip === 'No') return '';
  return ip;
}

function withIndefiniteArticle(value) {
  if (!value) return value;
  return /^[aeiou]/i.test(value) ? `an ${value}` : `a ${value}`;
}

function buildDescription(product) {
  const parts = [
    `${product.title} is ${withIndefiniteArticle(product.role)}.`,
    product.bluetooth ? `Uses ${product.bluetooth}.` : '',
    product.sensors.length ? `Core hardware: ${product.sensors.join(', ')}.` : '',
    product.batteryLife ? `Default battery life: ${product.batteryLife}.` : '',
    normalizeIp(product.ip) ? `Rated ${normalizeIp(product.ip)}.` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

function normalizeSensorsList(values) {
  const normalized = [];
  for (const value of values) {
    const lower = value.toLowerCase();
    if (lower.includes('3-axis accelerometer') || lower.includes('accelerometer')) {
      normalized.push('3-axis accelerometer');
      continue;
    }
    if (lower.includes('temperature logger')) {
      normalized.push('temperature logger (optional)');
      continue;
    }
    if (lower.includes('temperature sensor')) {
      normalized.push(lower.includes('optional') ? 'temperature sensor (optional)' : 'temperature sensor');
      continue;
    }
    if (lower.includes('temperature') && !lower.includes('pt100')) {
      normalized.push('temperature sensor');
      continue;
    }
    if (lower.includes('humidity sensor')) {
      normalized.push(lower.includes('optional') ? 'humidity sensor (optional)' : 'humidity sensor');
      continue;
    }
    if (lower.includes('humidity')) {
      normalized.push('humidity sensor');
      continue;
    }
    if (lower.includes('barometric')) {
      normalized.push('barometric pressure sensor');
      continue;
    }
    if (lower.includes('hall-effect') || lower.includes('hall effect')) {
      normalized.push('hall-effect sensor');
      continue;
    }
    if (lower.includes('hall switch')) {
      normalized.push('hall switch');
    }
  }
  return [...new Set(normalized)];
}

async function ensureLookupRow(baseUrl, token, tableId, rows, matchKey, matchValue, payload) {
  const existing = rows.find((row) => getRowString(row, matchKey) === matchValue);
  if (existing) return existing;
  if (!APPLY) {
    const draft = { Id: -1, ...payload };
    rows.push(draft);
    return draft;
  }
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
    Object.assign(existing, payload);
    return existing;
  }

  if (!APPLY) {
    const draft = { Id: -1, ...payload };
    devicesRows.push(draft);
    return draft;
  }

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
    Object.assign(existing, payload);
    return existing;
  }

  if (!APPLY) {
    const draft = { Id: -1, ...payload };
    specsRows.push(draft);
    return draft;
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

  for (const application of APPLICATIONS) {
    await ensureLookupRow(
      baseUrl,
      token,
      TABLE_IDS.applications,
      applicationsRows,
      'application_key',
      application.key,
      {
        title: application.name,
        application_key: application.key,
        application_name: application.name,
        description: application.description,
      },
    );
  }

  for (const tag of BUSINESS_TAGS) {
    await ensureLookupRow(
      baseUrl,
      token,
      TABLE_IDS.businessTags,
      businessTagsRows,
      'tag_key',
      tag.key,
      {
        title: tag.name,
        tag_key: tag.key,
        tag_name: tag.name,
        description: tag.description,
      },
    );
  }

  const applicationByKey = new Map(applicationsRows.map((row) => [getRowString(row, 'application_key'), row]));
  const tagByKey = new Map(businessTagsRows.map((row) => [getRowString(row, 'tag_key'), row]));

  const audit = {
    source: PORTFOLIO_SOURCE,
    mode: APPLY ? 'apply' : 'dry-run',
    countedKinds: {
      assetTagFamilies: 16,
      personnelAndEmergencyFamilies: 18,
      sensorTagFamiliesInPortfolio: 9,
      syncedSensorRows: 10,
      totalSyncedRows: PRODUCTS.length,
    },
    products: [],
  };

  for (const product of PRODUCTS) {
    const existingDevice = devicesRows.find((row) => getRowString(row, 'device_key') === product.key);
    const existingSpecs = specsRows.find((row) => getRowString(row, 'device_key') === product.key);
    const devicePayload = {
      title: product.title,
      device_key: product.key,
      device_name: product.title,
      manufacturer: 'MOKO SMART',
      model_number: product.model,
      category: product.category,
      subcategory: product.subcategory,
      role: product.role,
      description: buildDescription(product),
      datasheet_path: product.docPath,
      vendor_product_url: coalesceString(product.vendorUrl, getRowString(existingDevice, 'vendor_product_url')),
      status: 'active',
    };

    const deviceRow = await upsertDevice(baseUrl, token, devicesRows, devicePayload);
    const deviceId = getRowNumber(deviceRow, 'Id');
    const operatingRange = parseOperatingRange(product.operatingTemp);
    const specsPayload = {
      title: product.key,
      device_key: product.key,
      bluetooth_version: product.bluetooth,
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
      sensors: normalizeSensorsList(product.sensors).join(','),
      battery_life_estimate: coalesceString(product.batteryLife, getRowString(existingSpecs, 'battery_life_estimate')),
      battery_capacity: coalesceString(product.batteryCapacity, getRowString(existingSpecs, 'battery_capacity')),
      replaceable_battery: Boolean(product.replaceableBattery),
      ip_rating: coalesceString(normalizeIp(product.ip), getRowString(existingSpecs, 'ip_rating')),
      dimensions: coalesceString(product.dimensions, getRowString(existingSpecs, 'dimensions')),
      power_supply: coalesceString(buildPowerSupply(product), getRowString(existingSpecs, 'power_supply')),
      installation: coalesceString(product.installation, getRowString(existingSpecs, 'installation')),
      backhaul_type: BLE_BACKHAUL,
      manual_path: product.docPath,
      mounting_options_normalized: coalesceString(product.installation, getRowString(existingSpecs, 'mounting_options_normalized')),
      operating_temp_min_c: operatingRange.min,
      operating_temp_max_c: operatingRange.max,
    };

    await upsertSpecs(baseUrl, token, specsRows, specsPayload);

    const existingProtocolRows = deviceProtocolRows.filter((row) => getRowString(row, 'device_key') === product.key);
    const existingConnectivityRows = deviceConnectivityRows.filter((row) => getRowString(row, 'device_key') === product.key);
    const existingApplicationRows = deviceApplicationRows.filter((row) => getRowString(row, 'device_key') === product.key);
    const existingTagRows = deviceTagRows.filter((row) => getRowString(row, 'device_key') === product.key);

    await replaceJoinRows(baseUrl, token, TABLE_IDS.deviceProtocols, existingProtocolRows, [
      {
        title: `${product.key} | proto_ble | broadcast`,
        device_key: product.key,
        protocol_key: 'proto_ble',
        direction: 'broadcast',
        details: `Portfolio sync from ${PORTFOLIO_SOURCE}`,
        nc_24rw___devices_id: deviceId,
        nc_24rw___protocols_id: protocolBle.Id,
      },
    ]);

    await replaceJoinRows(baseUrl, token, TABLE_IDS.deviceConnectivity, existingConnectivityRows, [
      {
        title: `${product.key} | conn_ble`,
        device_key: product.key,
        connectivity_key: 'conn_ble',
        details: 'BLE device from MOKO portfolio summary',
        nc_24rw___devices_id: deviceId,
        nc_24rw___connectivity_options_id: connectivityBle.Id,
      },
    ]);

    await replaceJoinRows(
      baseUrl,
      token,
      TABLE_IDS.deviceApplications,
      existingApplicationRows,
      product.applicationKeys
        .map((applicationKey) => applicationByKey.get(applicationKey))
        .filter(Boolean)
        .map((applicationRow) => ({
          title: `${product.key} | ${getRowString(applicationRow, 'application_key')}`,
          device_key: product.key,
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
      product.businessTags
        .map((tagName) => tagByKey.get(`tag_${tagName}`))
        .filter(Boolean)
        .map((tagRow) => ({
          title: `${product.key} | ${getRowString(tagRow, 'tag_key')}`,
          device_key: product.key,
          tag_key: getRowString(tagRow, 'tag_key'),
          nc_24rw___devices_id: deviceId,
          nc_24rw___business_tags_id: tagRow.Id,
        })),
    );

    audit.products.push({
      key: product.key,
      title: product.title,
      category: product.category,
      existedBefore: Boolean(existingDevice),
      applications: product.applicationKeys,
      businessTags: product.businessTags,
      docPath: product.docPath,
    });
  }

  const auditDir = path.join(ROOT, 'tmp');
  await fs.mkdir(auditDir, { recursive: true });
  await fs.writeFile(path.join(auditDir, 'moko-demo-center-tag-beacon-audit.json'), JSON.stringify(audit, null, 2));

  console.log(`${APPLY ? 'Synced' : 'Prepared'} ${PRODUCTS.length} portfolio tag/beacon rows from ${PORTFOLIO_SOURCE}.`);
  console.log('Asset tag families: 16');
  console.log('Personnel/emergency families: 18');
  console.log('Sensor families in PDF: 9');
  console.log('Sensor rows synced: 10 (H4 + H4 Pro split)');
  console.log('Audit: tmp/moko-demo-center-tag-beacon-audit.json');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
