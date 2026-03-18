# Locate-IQ Gateway and Anchor Schema Audit

Date: 2026-03-16

## Scope

This audit compares the current NocoDB schema against the requested Gateway and Anchor knowledge-base scope:

- data interfaces and protocol stack
- physical and hardware specifications
- system architecture and computation distribution
- third-party integration readiness

## Current Coverage

The current schema already has a good foundation:

- `devices`: core catalog rows
- `device_specs`: physical and environmental specs
- `gateway_protocol_profiles`: gateway uplink/downlink capabilities
- `anchor_positioning_profiles`: anchor positioning behavior
- join tables for connectivity, protocols, applications, and tags

Current row counts:

- `devices`: 11
- `device_specs`: 11
- `gateway_protocol_profiles`: 7
- `anchor_positioning_profiles`: 4

## Findings

### 1. Data Interfaces: partially covered, but not documentation-grade yet

Current strengths:

- protocol support is captured at a yes/no level
- gateway profiles include `uplink_mqtt`, `uplink_http`, `uplink_websocket`, `downlink_method`, and `configuration_method`

Current gaps:

- no dedicated field for MQTT topic hierarchy example
- no dedicated field for MQTT JSON payload example
- no dedicated field for WebSocket endpoint URL
- no dedicated field for WebSocket heartbeat interval semantics
- no dedicated field for HTTPS endpoint / API route
- no dedicated field for HTTPS auth method
- no dedicated field for request method or headers
- no dedicated field for downlink command format
- no dedicated field for supported configuration parameters

Observed completeness:

- `gateway_protocol_profiles.mqtt_topic_pattern` is missing in 4 of 7 rows
- `gateway_protocol_profiles.heartbeat_interval_sec` is missing in 4 of 7 rows

### 2. Physical and hardware specs: solid base, but missing several decision-critical fields

Current strengths:

- Wi-Fi, Ethernet, PoE, cellular, GNSS, IP rating, power, installation, dimensions, weight

Current gaps:

- no explicit RJ45 field
- no explicit LTE / 4G / NB-IoT distinction field
- no mounting type normalization
- no indoor/outdoor suitability field
- no ruggedness / industrial grade interpretation field
- no local file path for SOP documents
- `datasheet_path` exists, but no verified absolute or network path strategy is stored

### 3. System architecture: mostly missing

This is the biggest gap relative to your assignment.

Missing fields:

- fat gateway vs thin gateway classification
- does coordinate calculation happen on-device
- does gateway forward raw BLE/UWB data only
- does gateway depend on a central positioning engine
- edge filtering / local decoding capability
- third-party integration prerequisites
- Node-RED readiness
- industrial platform compatibility notes

### 4. Anchor knowledge is too shallow for training and client support

Current anchor table is useful, but too light for a pre-sales copilot.

Observed completeness:

- `positioning_accuracy` missing in 3 of 4 rows
- `installation_height` missing in 3 of 4 rows
- `coverage_area` missing in 3 of 4 rows
- `network_protocols` missing in 3 of 4 rows
- `mounting_mode` missing in 3 of 4 rows

Missing anchor fields:

- anchor backhaul type
- PoE standard
- synchronization requirements
- recommended anchor density
- line-of-sight constraints
- installation caveats
- coordinate engine dependency

### 5. Relations are key-based, not true record links

Current tables use fields like:

- `device_key`
- `protocol_key`
- `connectivity_key`
- `application_key`
- `tag_key`

This works for now, but it is fragile:

- renaming a key can break joins
- difficult for non-technical users to maintain safely
- harder to use NocoDB relational UI features well

For long-term maintainability, these should become linked-record relationships.

## Recommended Schema Changes

### A. Extend `gateway_protocol_profiles`

Add these fields:

- `mqtt_topic_example`
- `mqtt_topic_hierarchy_notes`
- `mqtt_payload_json_example`
- `mqtt_payload_field_notes`
- `websocket_endpoint`
- `websocket_auth_method`
- `websocket_heartbeat_interval_sec`
- `websocket_payload_notes`
- `https_endpoint`
- `https_method`
- `https_auth_method`
- `https_headers_example`
- `https_body_example`
- `downlink_command_channel`
- `downlink_command_example`
- `configurable_parameters`
- `supports_refresh_rate_config`
- `supports_led_control`
- `supports_buzzer_control`
- `edge_computing_mode`
- `calculates_coordinates_locally`
- `forwards_raw_signals`
- `central_engine_dependency`
- `node_red_integration_ready`
- `third_party_platform_notes`

Suggested enum values for `edge_computing_mode`:

- `fat_gateway`
- `thin_gateway`
- `hybrid`
- `unknown`

### B. Extend `device_specs`

Add these fields:

- `rj45_support`
- `poe_mode`
- `backhaul_type`
- `lte_support`
- `lte_category`
- `indoor_outdoor_rating`
- `mounting_options_normalized`
- `mounting_difficulty`
- `recommended_spare_parts`
- `max_signal_range_open_space`
- `max_signal_range_real_world`
- `sop_path`
- `manual_path`

### C. Extend `anchor_positioning_profiles`

Add these fields:

- `backhaul_type`
- `poe_support`
- `poe_standard`
- `sync_requirement`
- `recommended_anchor_spacing`
- `recommended_anchor_density`
- `line_of_sight_requirement`
- `metal_interference_risk`
- `raw_signal_forwarding`
- `positioning_engine_location`
- `installation_prerequisites`
- `commissioning_notes`

### D. Add a dedicated `integration_profiles` table

This is optional, but a good fit if protocol data becomes richer.

Suggested fields:

- `device_key`
- `integration_type`
- `endpoint`
- `auth_method`
- `topic_or_route`
- `sample_request`
- `sample_response`
- `heartbeat_interval_sec`
- `command_example`
- `notes`

This avoids overloading `gateway_protocol_profiles` if you later document multiple integration modes per device.

### E. Add a `deployment_gotchas` table

Suggested fields:

- `device_key`
- `gotcha_title`
- `gotcha_description`
- `severity`
- `environment`
- `mitigation`
- `source`

This supports your tacit knowledge capture goal directly.

## Recommended Priorities

### Priority 1: minimum fields for the current assignment

Add first:

- `mqtt_topic_example`
- `mqtt_payload_json_example`
- `websocket_endpoint`
- `websocket_heartbeat_interval_sec`
- `https_endpoint`
- `https_method`
- `https_auth_method`
- `downlink_command_example`
- `configurable_parameters`
- `edge_computing_mode`
- `calculates_coordinates_locally`
- `forwards_raw_signals`
- `node_red_integration_ready`
- `backhaul_type`
- `rj45_support`

### Priority 2: improve anchor usability

Add next:

- `poe_standard`
- `recommended_anchor_density`
- `line_of_sight_requirement`
- `installation_prerequisites`
- `positioning_engine_location`

### Priority 3: maintenance and scalability

Then:

- convert key-based joins into linked-record relations
- add file-path verification strategy for datasheets and SOPs
- add a `deployment_gotchas` table

## Practical Recommendation

Keep NocoDB as the system of record for now.

For the next working iteration, use:

- `devices` for searchable product identity
- `device_specs` for hard filters
- `gateway_protocol_profiles` for integration answers
- `anchor_positioning_profiles` for installation and positioning logic
- `business_tags` and `device_tags` for business-friendly search
- a new `deployment_gotchas` table for tacit knowledge

This will keep the database understandable for interns and non-technical teammates while still supporting deterministic filtering in the frontend.
