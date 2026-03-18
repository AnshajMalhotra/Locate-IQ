# Locate-IQ Product Documents

Store UI-accessible PDFs here so the frontend can open them directly with paths like `/docs/...`.

Suggested structure:

- `public/docs/gateways/<model>/`
- `public/docs/anchors/<model>/`
- `public/docs/beacons/<model>/`
- `public/docs/tags/<model>/`
- `public/docs/sops/`

Examples:

- `/docs/gateways/mkgw4/MKGW4-Configuration-APP-User-Manual-V1.0.pdf`
- `/docs/anchors/l03/L03-Product-Brief_V2.0.pdf`
- `/docs/beacons/m1p/M1P-LED-Tag-Brief_241115.pdf`

Recommended next step:

1. Copy the product PDFs into the correct folder.
2. Update NocoDB fields such as `datasheet_path`, `manual_path`, or a dedicated web path field to point to `/docs/...`.
3. Keep UNC or local network paths only as fallback if needed.
