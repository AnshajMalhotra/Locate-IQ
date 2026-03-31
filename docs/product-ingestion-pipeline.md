# Product Ingestion Pipeline

This prototype is a review-first importer for new hardware products.

It reads:

- a product website
- a local product PDF under `public/docs/...`

Then it:

- extracts likely specs from the site and PDF
- maps them into the current Locate-IQ/NocoDB schema
- writes a review JSON file
- optionally applies the proposal to NocoDB

## Command

Dry run:

```bash
npm run ingest:product -- --url "<product-url>" --pdf "<local-pdf-path>" --category "<gateway|anchor|beacon|tag>"
```

Example:

```bash
npm run ingest:product -- --url "https://www.mokosmart.com/mokosmart-h4-beacon-temperature-humidity-sensor-supporting-ble5-0/" --pdf "public/docs/beacons/h4/H4-Series-Product-Brief_20250619.pdf" --category "beacon" --title "H4 Temperature & Humidity Sensor" --model "H4" --device-key "beacon_h4_temp_humidity_sensor"
```

Apply after review:

```bash
npm run ingest:product -- --url "<product-url>" --pdf "<local-pdf-path>" --category "<gateway|anchor|beacon|tag>" --apply
```

## Output

The script writes a review JSON file to:

```text
tmp/ingestion-reviews/<device-key>.json
```

That file includes:

- the inferred `devices` payload
- the inferred `device_specs` payload
- inferred connectivity/protocol/application/tag mappings
- field source snippets
- a `missingFields` list for manual review

## Recommended Workflow

1. Add the PDF to `public/docs/<category>/<model>/`
2. Run the importer in dry-run mode
3. Review the generated JSON
4. Correct parser rules if fields are wrong or incomplete
5. Re-run until the review looks good
6. Apply to NocoDB

## Why Review First

Do not trust website/PDF extraction blindly.

This pipeline is meant to get faster over time:

- when a field is wrong, refine the parser rule
- when a field is missing, add a new matcher
- keep the database clean by applying only reviewed proposals
