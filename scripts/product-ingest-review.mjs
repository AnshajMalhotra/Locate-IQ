import fs from 'node:fs/promises';
import path from 'node:path';

import { PDFParse } from 'pdf-parse';

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

const CONNECTIVITY_MATCHERS = [
  { key: 'conn_ble', label: 'BLE', patterns: [/\bble\b/i, /\bbluetooth\b/i] },
  { key: 'conn_wifi', label: 'Wi-Fi', patterns: [/\b(?:connectivity|supports?|backhaul|uplink)[^.:\n]{0,40}\bwi-?fi\b/i, /\bwi-?fi (?:gateway|uplink|backhaul)\b/i] },
  { key: 'conn_ethernet_poe', label: 'Ethernet / PoE', patterns: [/\b(?:connectivity|supports?|backhaul|uplink)[^.:\n]{0,40}\b(?:poe|ethernet|rj45)\b/i, /\b(?:poe|ethernet|rj45) (?:gateway|uplink|port|support)\b/i] },
  { key: 'conn_cellular', label: 'Cellular', patterns: [/\b(?:connectivity|supports?|backhaul|uplink)[^.:\n]{0,40}\b(?:cellular|4g|lte|cat\.?\s*\d)\b/i, /\b(?:cellular|4g|lte) (?:gateway|uplink|backhaul)\b/i] },
  { key: 'conn_lorawan', label: 'LoRaWAN', patterns: [/\b(?:connectivity|supports?|backhaul|uplink)[^.:\n]{0,40}\blorawan\b/i, /\blorawan (?:gateway|uplink|backhaul)\b/i] },
  { key: 'conn_gnss', label: 'GNSS', patterns: [/\b(?:connectivity|supports?|backhaul|uplink)[^.:\n]{0,40}\b(?:gnss|gps|lbs)\b/i, /\b(?:gnss|gps|lbs) (?:module|support|backhaul)\b/i] },
  { key: 'conn_uwb', label: 'UWB', patterns: [/\buwb\b/i] },
];

const PROTOCOL_MATCHERS = [
  { key: 'proto_ble', label: 'BLE', patterns: [/\bibeacon\b/i, /\beddystone\b/i, /\bble\b/i, /\bbluetooth\b/i], direction: 'broadcast' },
  { key: 'proto_mqtt', label: 'MQTT', patterns: [/\bmqtt\b/i], direction: 'uplink' },
  { key: 'proto_https', label: 'HTTPS', patterns: [/\bhttps\b/i, /\bhttp post\b/i], direction: 'uplink' },
  { key: 'proto_tcp_udp', label: 'UDP', patterns: [/\budp\b/i], direction: 'uplink' },
  { key: 'proto_tcp_udp', label: 'TCP', patterns: [/\btcp\b/i], direction: 'uplink' },
  { key: 'proto_websocket', label: 'WebSocket', patterns: [/\bwebsocket\b/i], direction: 'uplink' },
];

const APPLICATION_MATCHERS = [
  { label: 'Indoor Navigation', patterns: [/\bindoor navigation\b/i, /\bnavigation\b/i, /\brtls\b/i, /\bwayfinding\b/i] },
  { label: 'Warehouse Tracking', patterns: [/\bwarehouse\b/i] },
  { label: 'Logistics', patterns: [/\blogistics\b/i, /\basset tracking\b/i] },
  { label: 'Healthcare', patterns: [/\bhospital\b/i, /\bhealthcare\b/i, /\bmedical\b/i] },
  { label: 'Environmental Monitoring', patterns: [/\benvironmental monitoring\b/i, /\btemperature\b/i, /\bhumidity\b/i, /\bcold-?chain\b/i] },
];

const TAG_MATCHERS = [
  { label: 'sensor', key: 'tag_sensor', patterns: [/\bsensor\b/i, /\btemperature\b/i, /\bhumidity\b/i, /\bbarometric\b/i] },
  { label: 'beacon', key: 'tag_beacon', patterns: [/\bbeacon\b/i] },
  { label: 'gateway', key: 'tag_gateway', patterns: [/\bgateway\b/i] },
  { label: 'anchor', key: 'tag_anchor', patterns: [/\banchor\b/i, /\blocator\b/i] },
  { label: 'poe', key: 'tag_poe', patterns: [/\bpoe\b/i] },
  { label: 'ethernet', key: 'tag_ethernet', patterns: [/\bethernet\b/i, /\brj45\b/i] },
  { label: 'outdoor', key: 'tag_outdoor', patterns: [/\boutdoor\b/i, /\bip6[5-9]\b/i, /\bip67\b/i, /\bip68\b/i] },
  { label: 'aoa', key: 'tag_aoa', patterns: [/\baoa\b/i, /\bangle of arrival\b/i] },
];

const SENSOR_MATCHERS = [
  { label: 'temperature sensor', patterns: [/\btemperature sensor\b/i, /\btemperature & humidity sensor\b/i, /\btemp sensor\b/i] },
  { label: 'humidity sensor', patterns: [/\bhumidity sensor\b/i, /\btemperature & humidity sensor\b/i, /\btemperature and humidity sensor\b/i] },
  { label: 'accelerometer sensor', patterns: [/\baccelerometer\b/i] },
  { label: 'barometric pressure sensor', patterns: [/\bbarometric pressure sensor\b/i, /\bbarometric\b/i] },
  { label: 'hall-effect sensor', patterns: [/\bhall effect sensor\b/i, /\bhall-effect sensor\b/i] },
  { label: 'magnetometer sensor', patterns: [/\bmagnetometer\b/i] },
  { label: 'light sensor', patterns: [/\blight sensor\b/i] },
];

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      values[key] = true;
      continue;
    }
    values[key] = next;
    index += 1;
  }
  return values;
}

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
  return {
    baseUrl: baseUrl?.replace(/\/$/, ''),
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

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripHtml(html) {
  return normalizeWhitespace(
    html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&'),
  );
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&#8211;/g, '-')
    .replace(/&#038;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function extractMetaContent(html, matcher) {
  const match = html.match(matcher);
  return match?.[1] ? normalizeWhitespace(decodeHtmlEntities(match[1])) : '';
}

function extractSiteMeta(html) {
  return {
    title: extractMetaContent(html, /<title>([^<]+)<\/title>/i),
    description:
      extractMetaContent(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizePublicPath(value) {
  if (!value) return '';
  const normalized = value.replace(/\//g, path.sep);
  const publicRoot = path.join(ROOT, 'public');
  const relativePublicPrefix = `public${path.sep}`;
  if (normalized.startsWith(publicRoot)) {
    const publicPath = normalized.slice(publicRoot.length).replace(/\\/g, '/');
    return publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
  }
  if (normalized.startsWith(relativePublicPrefix)) {
    return `/${normalized.slice(relativePublicPrefix.length).replace(/\\/g, '/')}`;
  }
  if (value.startsWith('/')) return value.replace(/\\/g, '/');
  return value.replace(/\\/g, '/');
}

function findSnippet(text, pattern) {
  const match = text.match(pattern);
  if (!match || match.index === undefined) return null;
  const start = Math.max(0, match.index - 90);
  const end = Math.min(text.length, match.index + match[0].length + 90);
  return normalizeWhitespace(text.slice(start, end));
}

function extractValue(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeWhitespace(match[1]);
    }
  }
  return '';
}

function extractSentenceBlock(text, pattern) {
  const match = text.match(pattern);
  if (!match) return '';
  const start = match.index ?? 0;
  const end = Math.min(text.length, start + 420);
  return normalizeWhitespace(text.slice(start, end));
}

function extractLeadSentences(text, count = 2) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((entry) => normalizeWhitespace(entry))
    .filter(Boolean);
  return sentences.slice(0, count).join(' ');
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function getPdfLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line && !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line));
}

function extractOrderedSpecPairs(text) {
  const lines = getPdfLines(text);
  const leftLabels = [
    'Connectivity',
    'Dimensions',
    'Color',
    'Material',
    'Weight',
    'Sensor',
    'Detection threshold',
    'Battery capacity',
    'Battery lifespan',
    'Operating temperature',
  ];
  const rightLabels = [
    'Waterproof',
    'Transmission range',
    'Installation',
    'Certification',
  ];

  const firstLabelIndex = lines.findIndex((line) => line.replace(/:$/, '') === leftLabels[0]);
  if (firstLabelIndex === -1) return {};

  let cursor = firstLabelIndex;
  for (const label of leftLabels) {
    if (lines[cursor]?.replace(/:$/, '') !== label) return {};
    cursor += 1;
  }

  const pairs = {};
  const rightLabelStart = lines.findIndex((line, index) => index >= cursor && line.replace(/:$/, '') === rightLabels[0]);
  if (rightLabelStart === -1) return {};

  const leftValues = lines.slice(cursor, rightLabelStart);
  if (leftValues.length < leftLabels.length) return {};

  let leftValueIndex = 0;
  for (const label of leftLabels) {
    if (label === 'Dimensions') {
      pairs[label] = [leftValues[leftValueIndex], leftValues[leftValueIndex + 1]].filter(Boolean).join(' | ');
      leftValueIndex += 2;
      continue;
    }
    pairs[label] = leftValues[leftValueIndex] ?? '';
    leftValueIndex += 1;
  }

  cursor = rightLabelStart;
  for (const label of rightLabels) {
    if (lines[cursor]?.replace(/:$/, '') !== label) return pairs;
    cursor += 1;
  }

  const rightValues = lines
    .slice(cursor)
    .filter(
      (line) =>
        !/^(Data logging|Key benefits|S03D Door Monitoring Sensor|Wire-free|H4 Series|Temperature & Humidity Sensor|Application scenarios)$/i.test(line),
    );

  for (let index = 0; index < rightLabels.length; index += 1) {
    pairs[rightLabels[index]] = rightValues[index] ?? '';
  }

  return pairs;
}

function extractDimensionByModel(text, modelNumber) {
  const quotedModel = modelNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const modelPattern = new RegExp(`(\\d+(?:\\.\\d+)?mm\\s*x\\s*\\d+(?:\\.\\d+)?mm\\s*x\\s*\\d+(?:\\.\\d+)?mm)\\s*\\(${quotedModel}\\)`, 'i');
  const directMatch = text.match(modelPattern);
  if (directMatch?.[1]) return directMatch[1].replace(/\s+/g, ' ');
  const genericMatch = text.match(/(\d+(?:\.\d+)?mm\s*x\s*\d+(?:\.\d+)?mm\s*x\s*\d+(?:\.\d+)?mm)/i);
  return genericMatch?.[1]?.replace(/\s+/g, ' ') ?? '';
}

function detectList(text, matchers) {
  const hits = [];
  for (const matcher of matchers) {
    if (matcher.patterns.some((pattern) => pattern.test(text))) {
      hits.push(matcher);
    }
  }
  return hits;
}

function extractSensors(text) {
  return SENSOR_MATCHERS.filter((sensor) => sensor.patterns.some((pattern) => pattern.test(text))).map((sensor) => sensor.label);
}

function buildProposal({ args, siteText, pdfText }) {
  const siteMeta = extractSiteMeta(siteText);
  const siteDescription = siteMeta.description.length <= 320 ? siteMeta.description : '';
  const corpus = normalizeWhitespace(`${siteMeta.title}. ${siteDescription}. ${pdfText}`);
  const technicalCorpus = pdfText;
  const specPairs = extractOrderedSpecPairs(pdfText);
  const normalizedPdfPath = normalizePublicPath(args.pdf);

  const title = args.title || siteMeta.title || '';
  const modelNumber =
    args.model ||
    extractValue(technicalCorpus, [
      /\bmodel(?: number)?[:\s]+([A-Za-z0-9\-+ ]{2,40})/i,
      /\b(H4 Pro|H4|MKGW1-BW Pro|MKGW4|M1P|M5|L03|L04|L05)\b/i,
    ]);

  const bluetoothVersion = extractValue(technicalCorpus, [
    /\bConnectivity:\s*(BLE\s*5(?:\.\d+)?)/i,
    /\bConnectivity[:\s]+BLE\s*(5(?:\.\d+)?)/i,
    /\b(?:BLE|Bluetooth)\s*(5(?:\.\d+)?)/i,
    /\b(BLE 5(?:\.\d+)?)/i,
  ]);

  const batteryLifeEstimate = specPairs['Battery lifespan'] || extractValue(technicalCorpus, [
    /\bbattery (?:life|lifespan)[:\s]+(\d+(?:\.\d+)?\s*(?:years?|months?))/i,
    /\blifespan[:\s]+(\d+(?:\.\d+)?\s*(?:years?|months?))/i,
    /\b(\d+(?:\.\d+)?\+?\s*(?:years?|months?))/i,
  ]);

  const batteryCapacity = specPairs['Battery capacity'] || extractValue(technicalCorpus, [
    /\bbattery capacity[:\s]+([^]+?)(?:\s+battery lifespan|\s+battery life|\s+lifespan|\s+flash|$)/i,
    /\b(\d{2,5}\s*mAh[^;\n|]*)/i,
  ]);

  const ipRating = specPairs.Waterproof || extractValue(technicalCorpus, [/\b(?:IP rating|Waterproof)[:\s]+(IPX?\d{1,2})\b/i]);
  const dimensions =
    specPairs.Dimensions ||
    extractDimensionByModel(technicalCorpus, modelNumber) ||
    extractValue(technicalCorpus, [/\bdimensions?(?:\s*\(mm\))?[:\s]+([^\n]+?)(?:\s+connectivity|\s+color|\s+material|$)/i, /\bsize[:\s]+([^\n]+)/i]);
  const weight = specPairs.Weight || extractValue(technicalCorpus, [/\bweight[:\s]+([^\n]+?)(?:\s+installation|\s+material|$)/i]);
  const powerSupply = specPairs['Battery capacity'] ? `Battery | ${specPairs['Battery capacity']}` : extractValue(technicalCorpus, [
    /\bpower supply[:\s]+([^\n]+)/i,
    /\bbattery capacity[:\s]+([^\n]+?)(?:\s+battery life|\s+lifespan|$)/i,
  ]);
  const installation = specPairs.Installation || extractValue(technicalCorpus, [/\binstallation[:\s]+([^\n]+?)(?:\s+certification|$)/i]);
  const material = specPairs.Material || extractValue(technicalCorpus, [/\bmaterial[:\s]+([A-Za-z+& ]+?)(?:\s+ip rating|\s+battery capacity|$)/i]);
  const sensors = dedupe(extractSensors(technicalCorpus));
  const connectivity = detectList(technicalCorpus, CONNECTIVITY_MATCHERS);
  const protocols = detectList(technicalCorpus, PROTOCOL_MATCHERS);
  const applications = detectList(corpus, APPLICATION_MATCHERS).map((entry) => entry.label);
  const tags = dedupe([
    args.category,
    ...detectList(corpus, TAG_MATCHERS).map((entry) => entry.label),
  ]);

  const deviceKey =
    args['device-key'] ||
    `${args.category}_${slugify(modelNumber || title || path.basename(normalizedPdfPath, path.extname(normalizedPdfPath)))}`;

  const proposal = {
    device: {
      title: args.title || title.replace(/\s*\|\s*[^|]+$/, '').trim(),
      device_key: deviceKey,
      device_name: args['device-name'] || args.title || title.replace(/\s*\|\s*[^|]+$/, '').trim(),
      manufacturer: args.manufacturer || 'MOKO SMART',
      model_number: modelNumber,
      category: args.category,
      subcategory: args.subcategory || `${connectivity[0]?.label ?? 'BLE'} ${args.category}`.trim(),
      role: args.role || `${sensors.length ? 'sensor ' : ''}${args.category}`.trim(),
      description:
        args.description ||
        siteDescription ||
        extractLeadSentences(pdfText, 2) ||
        extractSentenceBlock(pdfText, /\bDiscover\b/i) ||
        extractSentenceBlock(pdfText, /\bPerfect for\b/i),
      datasheet_path: normalizedPdfPath,
      vendor_product_url: args.url,
      status: 'active',
    },
    specs: {
      title: deviceKey,
      device_key: deviceKey,
      bluetooth_version: bluetoothVersion ? `BLE ${bluetoothVersion.replace(/^BLE\s*/i, '')}` : '',
      sensors: sensors.join(','),
      battery_life_estimate: batteryLifeEstimate,
      ip_rating: ipRating,
      backhaul_type: connectivity.some((entry) => entry.key === 'conn_ble') ? 'BLE sensor telemetry via gateway / tracker uplink' : '',
      power_supply: powerSupply,
      installation,
      battery_capacity: batteryCapacity,
      dimensions,
      weight,
      material,
      manual_path: normalizedPdfPath,
    },
    connectivity: connectivity.map((entry) => ({ key: entry.key, label: entry.label })),
    protocols: protocols.map((entry) => ({
      protocol_key: entry.key,
      name: entry.label,
      direction: entry.direction,
      details: '',
    })),
    applications,
    tags,
    sources: {
      batteryLifeEstimate: findSnippet(technicalCorpus, /\bbattery (?:life|lifespan)[:\s]+[^\n]+/i) || findSnippet(technicalCorpus, /\b\d+(?:\.\d+)?\+?\s*(?:years?|months?)\b/i),
      batteryCapacity: findSnippet(technicalCorpus, /\bbattery capacity[:\s]+[^\n]+/i) || findSnippet(technicalCorpus, /\b\d{2,5}\s*mAh[^\n]*/i),
      dimensions: specPairs.Dimensions || findSnippet(technicalCorpus, /\bdimensions?(?:\s*\(mm\))?[:\s]+[^\n]+/i),
      powerSupply: findSnippet(technicalCorpus, /\bpower supply[:\s]+[^\n]+/i) || findSnippet(technicalCorpus, /\bbattery capacity[:\s]+[^\n]+/i),
      sensors: findSnippet(technicalCorpus, /\b(?:temperature sensor|humidity sensor|accelerometer|barometric pressure sensor|hall effect sensor)[^\n]*/i),
      ipRating: findSnippet(technicalCorpus, /\bIP rating[:\s]+IPX?\d{1,2}\b/i),
    },
  };

  const missingFields = [
    ['device.title', proposal.device.title],
    ['device.model_number', proposal.device.model_number],
    ['device.description', proposal.device.description],
    ['specs.bluetooth_version', proposal.specs.bluetooth_version],
    ['specs.battery_life_estimate', proposal.specs.battery_life_estimate],
    ['specs.battery_capacity', proposal.specs.battery_capacity],
    ['specs.dimensions', proposal.specs.dimensions],
    ['specs.power_supply', proposal.specs.power_supply],
    ['specs.sensors', proposal.specs.sensors],
  ]
    .filter(([, value]) => !String(value ?? '').trim())
    .map(([field]) => field);

  return {
    input: {
      url: args.url,
      pdf: normalizedPdfPath,
      category: args.category,
    },
    proposal,
    review: {
      parsedPdfSpecs: specPairs,
      missingFields,
      notes: [
        'Review this JSON before applying it to NocoDB.',
        'If any field is wrong or incomplete, refine the parser rules rather than editing the DB directly.',
      ],
    },
  };
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

async function replaceJoinRows(baseUrl, token, tableId, existingRows, nextRows) {
  if (existingRows.length) {
    await deleteRecords(
      baseUrl,
      token,
      tableId,
      existingRows.map((row) => ({ Id: row.Id })),
    );
  }
  if (nextRows.length) {
    await createRecords(baseUrl, token, tableId, nextRows);
  }
}

async function applyProposal(proposal, config) {
  if (!config.baseUrl || !config.token) {
    throw new Error('Missing NocoDB config in .env. Apply mode needs base URL and API token.');
  }

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
    fetchAll(config.baseUrl, config.token, TABLE_IDS.devices),
    fetchAll(config.baseUrl, config.token, TABLE_IDS.deviceSpecs),
    fetchAll(config.baseUrl, config.token, TABLE_IDS.protocols),
    fetchAll(config.baseUrl, config.token, TABLE_IDS.connectivityOptions),
    fetchAll(config.baseUrl, config.token, TABLE_IDS.applications),
    fetchAll(config.baseUrl, config.token, TABLE_IDS.businessTags),
    fetchAll(config.baseUrl, config.token, TABLE_IDS.deviceProtocols),
    fetchAll(config.baseUrl, config.token, TABLE_IDS.deviceConnectivity),
    fetchAll(config.baseUrl, config.token, TABLE_IDS.deviceApplications),
    fetchAll(config.baseUrl, config.token, TABLE_IDS.deviceTags),
  ]);

  const existingDevice = devicesRows.find((row) => getRowString(row, 'device_key') === proposal.device.device_key);
  let deviceRow = existingDevice;
  if (existingDevice) {
    await patchRecords(config.baseUrl, config.token, TABLE_IDS.devices, [{ Id: existingDevice.Id, ...proposal.device }]);
    deviceRow = { ...existingDevice, ...proposal.device };
  } else {
    const createdResponse = await createRecords(config.baseUrl, config.token, TABLE_IDS.devices, [proposal.device]);
    deviceRow = Array.isArray(createdResponse) ? createdResponse[0] : createdResponse;
  }
  const deviceId = getRowNumber(deviceRow, 'Id');

  const existingSpecs = specsRows.find((row) => getRowString(row, 'device_key') === proposal.specs.device_key);
  const fullSpecsPayload = {
    ...proposal.specs,
    wifi_support: proposal.connectivity.some((entry) => entry.key === 'conn_wifi'),
    wifi_band: '',
    ethernet_support: proposal.connectivity.some((entry) => entry.key === 'conn_ethernet_poe'),
    poe_support: proposal.connectivity.some((entry) => entry.key === 'conn_ethernet_poe'),
    poe_standard: '',
    rj45_support: proposal.connectivity.some((entry) => entry.key === 'conn_ethernet_poe'),
    cellular_support: proposal.connectivity.some((entry) => entry.key === 'conn_cellular'),
    cellular_type: '',
    gnss_support: proposal.connectivity.some((entry) => entry.key === 'conn_gnss'),
    lte_support: proposal.connectivity.some((entry) => entry.key === 'conn_cellular'),
    lte_category: '',
    replaceable_battery: /replaceable/i.test(proposal.specs.battery_capacity) || /replaceable/i.test(proposal.specs.power_supply),
  };

  if (existingSpecs) {
    await patchRecords(config.baseUrl, config.token, TABLE_IDS.deviceSpecs, [{ Id: existingSpecs.Id, ...fullSpecsPayload }]);
  } else {
    await createRecords(config.baseUrl, config.token, TABLE_IDS.deviceSpecs, [fullSpecsPayload]);
  }

  const applicationRows = [];
  for (const applicationName of proposal.applications) {
    const applicationKey = `app_${slugify(applicationName)}`;
    const row = await ensureLookupRow(
      config.baseUrl,
      config.token,
      TABLE_IDS.applications,
      applicationsRows,
      'application_key',
      applicationKey,
      {
        title: applicationName,
        application_key: applicationKey,
        application_name: applicationName,
        description: `${applicationName} use cases.`,
      },
    );
    applicationRows.push(row);
  }

  const tagRows = [];
  for (const tagName of proposal.tags) {
    const matcher = TAG_MATCHERS.find((entry) => entry.label === tagName);
    const tagKey = matcher?.key ?? `tag_${slugify(tagName)}`;
    const row = await ensureLookupRow(
      config.baseUrl,
      config.token,
      TABLE_IDS.businessTags,
      businessTagsRows,
      'tag_key',
      tagKey,
      {
        title: tagName,
        tag_key: tagKey,
        tag_name: tagName,
        description: `${tagName} device classification.`,
      },
    );
    tagRows.push(row);
  }

  const protocolRows = proposal.protocols
    .map((entry) => {
      const row = protocolsRows.find((item) => getRowString(item, 'protocol_key') === entry.protocol_key);
      return row ? { ...entry, row } : null;
    })
    .filter(Boolean);

  const connectivityOptionRows = proposal.connectivity
    .map((entry) => {
      const row = connectivityRows.find((item) => getRowString(item, 'connectivity_key') === entry.key);
      return row ? { ...entry, row } : null;
    })
    .filter(Boolean);

  await replaceJoinRows(
    config.baseUrl,
    config.token,
    TABLE_IDS.deviceProtocols,
    deviceProtocolRows.filter((row) => getRowString(row, 'device_key') === proposal.device.device_key),
    protocolRows.map((entry) => ({
      title: `${proposal.device.device_key} | ${entry.protocol_key} | ${entry.direction}`,
      device_key: proposal.device.device_key,
      protocol_key: entry.protocol_key,
      direction: entry.direction,
      details: entry.details,
      nc_24rw___devices_id: deviceId,
      nc_24rw___protocols_id: entry.row.Id,
    })),
  );

  await replaceJoinRows(
    config.baseUrl,
    config.token,
    TABLE_IDS.deviceConnectivity,
    deviceConnectivityRows.filter((row) => getRowString(row, 'device_key') === proposal.device.device_key),
    connectivityOptionRows.map((entry) => ({
      title: `${proposal.device.device_key} | ${entry.key}`,
      device_key: proposal.device.device_key,
      connectivity_key: entry.key,
      details: entry.label,
      nc_24rw___devices_id: deviceId,
      nc_24rw___connectivity_options_id: entry.row.Id,
    })),
  );

  await replaceJoinRows(
    config.baseUrl,
    config.token,
    TABLE_IDS.deviceApplications,
    deviceApplicationRows.filter((row) => getRowString(row, 'device_key') === proposal.device.device_key),
    applicationRows.map((entry) => ({
      title: `${proposal.device.device_key} | ${getRowString(entry, 'application_key')}`,
      device_key: proposal.device.device_key,
      application_key: getRowString(entry, 'application_key'),
      nc_24rw___devices_id: deviceId,
      nc_24rw___applications_id: entry.Id,
    })),
  );

  await replaceJoinRows(
    config.baseUrl,
    config.token,
    TABLE_IDS.deviceTags,
    deviceTagRows.filter((row) => getRowString(row, 'device_key') === proposal.device.device_key),
    tagRows.map((entry) => ({
      title: `${proposal.device.device_key} | ${getRowString(entry, 'tag_key')}`,
      device_key: proposal.device.device_key,
      tag_key: getRowString(entry, 'tag_key'),
      nc_24rw___devices_id: deviceId,
      nc_24rw___business_tags_id: entry.Id,
    })),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url || !args.pdf || !args.category) {
    throw new Error('Usage: node scripts/product-ingest-review.mjs --url <product-url> --pdf <path-to-pdf> --category <gateway|anchor|beacon|tag> [--title ...] [--model ...] [--device-key ...] [--apply]');
  }

  const pdfPath = path.isAbsolute(args.pdf) ? args.pdf : path.join(ROOT, args.pdf);
  const [html, pdfBuffer] = await Promise.all([
    fetch(args.url).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch product URL ${args.url}: ${response.status} ${response.statusText}`);
      }
      return response.text();
    }),
    fs.readFile(pdfPath),
  ]);

  const parser = new PDFParse({ data: pdfBuffer });
  const pdfResult = await parser.getText();
  await parser.destroy();
  const siteText = stripHtml(html);
  const proposalPayload = buildProposal({
    args,
    siteText: `${html}\n${siteText}`,
    pdfText: String(pdfResult.text),
  });

  const outputPath = args.output
    ? path.resolve(ROOT, args.output)
    : path.join(ROOT, 'tmp', 'ingestion-reviews', `${proposalPayload.proposal.device.device_key}.json`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(proposalPayload, null, 2)}\n`, 'utf8');

  if (APPLY) {
    const config = await loadConfig();
    await applyProposal(proposalPayload.proposal, config);
  }

  console.log(`${APPLY ? 'Applied' : 'Prepared'} ingestion review for ${proposalPayload.proposal.device.device_key}`);
  console.log(`Review JSON: ${path.relative(ROOT, outputPath)}`);
  if (proposalPayload.review.missingFields.length) {
    console.log(`Missing fields: ${proposalPayload.review.missingFields.join(', ')}`);
  } else {
    console.log('Missing fields: none');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
