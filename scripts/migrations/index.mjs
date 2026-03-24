export const migrations = [
  {
    id: '001-add-gateway-anchor-fields',
    description: 'Add Gateway and Anchor schema fields to NocoDB tables.',
    command: ['node', 'scripts/nocodb-add-gateway-anchor-fields.mjs', '--apply'],
  },
  {
    id: '002-populate-moko-research',
    description: 'Populate gateway, anchor, and device details from researched vendor sources.',
    command: ['node', 'scripts/nocodb-populate-moko-research.mjs', '--apply'],
  },
  {
    id: '003-seed-moko-additional-devices',
    description: 'Seed additional MOKO beacon and anchor rows into the database.',
    command: ['node', 'scripts/nocodb-seed-moko-additional-devices.mjs', '--apply'],
  },
  {
    id: '004-add-linked-record-columns',
    description: 'Add linked-record columns for devices, profiles, and join tables.',
    command: ['node', 'scripts/nocodb-add-linked-record-columns.mjs', '--apply'],
  },
  {
    id: '005-backfill-linked-records',
    description: 'Backfill linked-record fields from existing key-based relationships.',
    command: ['node', 'scripts/nocodb-backfill-linked-records.mjs', '--apply'],
  },
  {
    id: '006-add-vendor-url-field',
    description: 'Add vendor product URL field to devices.',
    command: ['node', 'scripts/nocodb-add-vendor-url-field.mjs', '--apply'],
  },
  {
    id: '007-populate-vendor-urls',
    description: 'Populate official vendor product page URLs for current devices.',
    command: ['node', 'scripts/nocodb-populate-vendor-urls.mjs', '--apply'],
  },
  {
    id: '008-add-device-variant-schema',
    description: 'Add device variant tables, firmware table, and variant grouping field.',
    command: ['node', 'scripts/nocodb-add-device-variant-schema.mjs', '--apply'],
  },
  {
    id: '009-simplify-device-variants',
    description: 'Store firmware summary directly on device variants and backfill from variant firmware rows.',
    command: ['node', 'scripts/nocodb-simplify-device-variants.mjs', '--apply'],
  },
  {
    id: '010-add-device-sensors-field',
    description: 'Add device-level sensors field to device specs.',
    command: ['node', 'scripts/nocodb-add-device-sensors-field.mjs', '--apply'],
  },
  {
    id: '011-populate-device-sensors',
    description: 'Populate device-level sensors from mapped device variants.',
    command: ['node', 'scripts/nocodb-populate-device-sensors.mjs', '--apply'],
  },
  {
    id: '012-convert-device-sensors-to-multiselect',
    description: 'Convert device specs sensors field to MultiSelect and normalize stored values.',
    command: ['node', 'scripts/nocodb-convert-device-sensors-to-multiselect.mjs', '--apply'],
  },
];
