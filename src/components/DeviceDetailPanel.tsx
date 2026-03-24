import { useState } from 'react';

import { Device, DeviceOption, DeviceSavePayload } from '../data/mockDevices';

interface DeviceDetailPanelProps {
  device: Device | null;
  newDeviceDraft: DeviceSavePayload | null;
  canEditDatabase: boolean;
  protocolOptions: DeviceOption[];
  connectivityOptions: DeviceOption[];
  saveState: 'idle' | 'saving' | 'saved' | 'failed';
  saveMessage: string | null;
  onCreateDraft: () => void;
  onCancelCreate: () => void;
  onSave: (device: Device, payload: DeviceSavePayload) => Promise<void>;
  onCreate: (payload: DeviceSavePayload) => Promise<void>;
}

type DetailTab = 'overview' | 'specs' | 'profiles' | 'variants' | 'documents';

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white';

function createPanelEmptyDraft(): DeviceSavePayload {
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

function toFileHref(path: string) {
  if (path.startsWith('/docs/')) return path;
  if (path.startsWith('\\\\')) return `file:${path.replace(/\\/g, '/')}`;
  if (/^[A-Za-z]:\\/.test(path)) return `file:///${path.replace(/\\/g, '/')}`;
  return path;
}

function buildDraft(device: Device, protocolOptions: DeviceOption[], connectivityOptions: DeviceOption[]): DeviceSavePayload {
  const protocolKeyByLabel = new Map(protocolOptions.map((option) => [option.label, option.key]));
  const connectivityKeyByLabel = new Map(connectivityOptions.map((option) => [option.label, option.key]));

  return {
    key: device.key,
    category: device.category,
    title: device.title,
    manufacturer: device.manufacturer,
    modelNumber: device.modelNumber ?? '',
    subcategory: device.subcategory ?? '',
    role: device.role ?? '',
    status: device.status,
    description: device.description,
    vendorProductUrl: device.vendorProductUrl ?? '',
    datasheetPath: device.datasheetPath ?? device.documents[0]?.path ?? '',
    specs: {
      bluetoothVersion: device.specs.bluetoothVersion ?? '',
      sensors: device.specs.sensors?.join('\n') ?? '',
      batteryLifeEstimate: device.specs.batteryLifeEstimate ?? '',
      ipRating: device.specs.ipRating ?? '',
      backhaulType: device.specs.backhaulType ?? '',
      powerSupply: device.specs.powerSupply ?? '',
      installation: device.specs.installation ?? '',
      batteryCapacity: device.specs.batteryCapacity ?? '',
      dimensions: device.specs.dimensions ?? '',
      weight: device.specs.weight ?? '',
    },
    connectivityKeys: device.connectivity.map((entry) => connectivityKeyByLabel.get(entry)).filter((value): value is string => Boolean(value)),
    protocols: device.protocols.map((protocol) => ({
      protocolKey: protocol.key ?? protocolKeyByLabel.get(protocol.name) ?? '',
      direction: protocol.direction,
      details: protocol.details ?? '',
    })),
    gatewayProfile: device.gatewayProfile
      ? {
          edgeComputingMode: device.gatewayProfile.edgeComputingMode ?? '',
          configurationMethod: device.gatewayProfile.configurationMethod ?? '',
          configurableParameters: device.gatewayProfile.configurableParameters ?? '',
          notes: device.gatewayProfile.notes ?? '',
        }
      : undefined,
    anchorProfile: device.anchorProfile
      ? {
          positioningTechnology: device.anchorProfile.positioningTechnology ?? '',
          positioningAccuracy: device.anchorProfile.positioningAccuracy ?? '',
          installationHeight: device.anchorProfile.installationHeight ?? '',
          mountingMode: device.anchorProfile.mountingMode ?? '',
          networkProtocols: device.anchorProfile.networkProtocols ?? '',
          commissioningNotes: device.anchorProfile.commissioningNotes ?? '',
          notes: device.anchorProfile.notes ?? '',
        }
      : undefined,
  };
}

function Field({ label, value, onChange, rows = 1 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {rows > 1 ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className={inputClass} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
      )}
    </label>
  );
}

function formatDisplayValue(value: string | number | undefined | null) {
  if (value === undefined || value === null) return 'Not mapped';
  const normalized = String(value).trim();
  return normalized || 'Not mapped';
}

function formatBooleanValue(value: boolean | undefined) {
  if (value === undefined) return 'Not mapped';
  return value ? 'Yes' : 'No';
}

function ReadOnlyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string | number | undefined | null;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm font-medium text-slate-900 ${multiline ? 'whitespace-pre-line leading-6' : ''}`}>{formatDisplayValue(value)}</p>
    </div>
  );
}

function ReadOnlyPillGroup({ label, values }: { label: string; values: string[] }) {
  const normalizedValues = values.filter(Boolean);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      {normalizedValues.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {normalizedValues.map((value) => (
            <span key={`${label}-${value}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm font-medium text-slate-900">Not mapped</p>
      )}
    </div>
  );
}

function formatVariantCell(values: string[]) {
  if (!values.length) return 'Not mapped';
  return values.join('\n');
}

function DeviceVariantComparison({ device }: { device: Device }) {
  if (!device.variants?.length) return null;

  const rows = [
    {
      label: 'Work Mode',
      values: device.variants.map((variant) => formatVariantCell(variant.workModes)),
    },
    {
      label: 'BLE Firmware',
      values: device.variants.map((variant) => formatVariantCell(variant.firmwareSummary)),
    },
    {
      label: 'Sensors',
      values: device.variants.map((variant) => formatVariantCell(variant.sensors)),
    },
    {
      label: 'Other',
      values: device.variants.map((variant) => formatVariantCell(variant.notes)),
    },
  ];

  return (
    <section className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">Variant Comparison</h4>
          <p className="mt-1 text-sm text-slate-600">
            {device.variantGroup ?? `${device.modelNumber ?? device.title} variants`} across work mode, firmware, sensors, and notes.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          {device.variants.length} variants
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm text-slate-700">
          <thead className="bg-slate-100 text-slate-900">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Attribute
              </th>
              {device.variants.map((variant) => (
                <th key={variant.id} className="border-b border-l border-slate-200 px-4 py-3 text-left align-top">
                  <p className="font-semibold text-slate-950">{variant.label}</p>
                  {variant.chipset ? <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{variant.chipset}</p> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label} className={rowIndex % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                <th className="border-b border-slate-200 px-4 py-3 text-left align-top text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {row.label}
                </th>
                {row.values.map((value, columnIndex) => (
                  <td key={`${row.label}-${device.variants?.[columnIndex]?.id ?? columnIndex}`} className="whitespace-pre-line border-b border-l border-slate-200 px-4 py-3 align-top">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeviceDetailPanel({
  device,
  newDeviceDraft,
  canEditDatabase,
  protocolOptions,
  connectivityOptions,
  saveState,
  saveMessage,
  onCreateDraft,
  onCancelCreate,
  onSave,
  onCreate,
}: DeviceDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [draft, setDraft] = useState<DeviceSavePayload | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!device && !newDeviceDraft) {
    return (
      <aside className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Device Details</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">Select a device to inspect technical fit</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">Use the filters to narrow the shortlist, then open a device card to review and edit mapped data.</p>
        {canEditDatabase ? (
          <button type="button" onClick={onCreateDraft} className="mt-5 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
            Add device
          </button>
        ) : null}
      </aside>
    );
  }

  const currentDevice = device;
  const isCreating = !currentDevice;
  const activeDraft =
    draft ??
    newDeviceDraft ??
    buildDraft(currentDevice as Device, protocolOptions, connectivityOptions);

  function updateDraft(next: Partial<DeviceSavePayload>) {
    setDraft((current) => (current ? { ...current, ...next } : { ...activeDraft, ...next }));
  }

  function updateSpecs(key: keyof DeviceSavePayload['specs'], value: string) {
    updateDraft({ specs: { ...activeDraft.specs, [key]: value } });
  }

  async function saveDraft() {
    try {
      if (isCreating) {
        await onCreate(activeDraft);
      } else {
        await onSave(currentDevice as Device, activeDraft);
      }
      setIsEditing(false);
      setDraft(null);
      setLocalError(null);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error));
    }
  }

  const batteryLifeValue = currentDevice?.specs.batteryLifeEstimate ?? '';
  const readTabs = currentDevice
    ? [
        { key: 'overview' as const, label: 'Overview' },
        { key: 'specs' as const, label: 'Specs' },
        ...(currentDevice.gatewayProfile || currentDevice.anchorProfile ? [{ key: 'profiles' as const, label: 'Profiles' }] : []),
        ...(currentDevice.variants?.length ? [{ key: 'variants' as const, label: 'Variants' }] : []),
        { key: 'documents' as const, label: 'Documents' },
      ]
    : [];

  return (
    <aside className="flex max-h-[calc(100vh-3rem)] min-h-[520px] flex-col rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Device Details</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">{isCreating ? 'Create New Device' : currentDevice?.title}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {isCreating ? 'Add a new gateway, anchor, or beacon directly into NocoDB.' : `${currentDevice?.manufacturer}${currentDevice?.modelNumber ? ` | ${currentDevice.modelNumber}` : ''}${currentDevice?.role ? ` | ${currentDevice.role}` : ''}`}
          </p>
        </div>
        {canEditDatabase ? (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button type="button" onClick={() => { setIsEditing(false); setDraft(null); setLocalError(null); if (isCreating) onCancelCreate(); }} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
                <button type="button" onClick={() => void saveDraft()} disabled={saveState === 'saving'} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:bg-emerald-300">{saveState === 'saving' ? 'Saving...' : isCreating ? 'Create' : 'Save'}</button>
              </>
            ) : (
              <button type="button" onClick={() => { setDraft(isCreating ? activeDraft : buildDraft(currentDevice as Device, protocolOptions, connectivityOptions)); setIsEditing(true); }} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">{isCreating ? 'Start editing' : 'Edit device'}</button>
            )}
          </div>
        ) : (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">Read-only</span>
        )}
      </div>

      {(saveMessage || localError) && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${localError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {localError ?? saveMessage}
        </div>
      )}

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
      {isEditing ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Device Key" value={activeDraft.key} onChange={(value) => updateDraft({ key: value })} />
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</span>
              <select value={activeDraft.category} onChange={(event) => updateDraft({ category: event.target.value as DeviceSavePayload['category'] })} className={inputClass}>
                <option value="gateway">Gateway</option>
                <option value="anchor">Anchor</option>
                <option value="beacon">Beacon</option>
              </select>
            </label>
            <Field label="Title" value={activeDraft.title} onChange={(value) => updateDraft({ title: value })} />
            <Field label="Manufacturer" value={activeDraft.manufacturer} onChange={(value) => updateDraft({ manufacturer: value })} />
            <Field label="Model Number" value={activeDraft.modelNumber} onChange={(value) => updateDraft({ modelNumber: value })} />
            <Field label="Status" value={activeDraft.status} onChange={(value) => updateDraft({ status: value })} />
            <Field label="Subcategory" value={activeDraft.subcategory} onChange={(value) => updateDraft({ subcategory: value })} />
            <Field label="Role" value={activeDraft.role} onChange={(value) => updateDraft({ role: value })} />
            <Field label="Vendor URL" value={activeDraft.vendorProductUrl} onChange={(value) => updateDraft({ vendorProductUrl: value })} />
            <Field label="Datasheet Path" value={activeDraft.datasheetPath} onChange={(value) => updateDraft({ datasheetPath: value })} />
            <div className="sm:col-span-2"><Field label="Description" value={activeDraft.description} onChange={(value) => updateDraft({ description: value })} rows={4} /></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bluetooth Version" value={activeDraft.specs.bluetoothVersion} onChange={(value) => updateSpecs('bluetoothVersion', value)} />
            <Field label="Sensors" value={activeDraft.specs.sensors} onChange={(value) => updateSpecs('sensors', value)} rows={3} />
            <Field label="Battery Lifespan" value={activeDraft.specs.batteryLifeEstimate} onChange={(value) => updateSpecs('batteryLifeEstimate', value)} />
            <Field label="IP Rating" value={activeDraft.specs.ipRating} onChange={(value) => updateSpecs('ipRating', value)} />
            <Field label="Backhaul Type" value={activeDraft.specs.backhaulType} onChange={(value) => updateSpecs('backhaulType', value)} />
            <Field label="Power Supply" value={activeDraft.specs.powerSupply} onChange={(value) => updateSpecs('powerSupply', value)} />
            <Field label="Installation" value={activeDraft.specs.installation} onChange={(value) => updateSpecs('installation', value)} />
            <Field label="Battery Capacity" value={activeDraft.specs.batteryCapacity} onChange={(value) => updateSpecs('batteryCapacity', value)} />
            <Field label="Dimensions" value={activeDraft.specs.dimensions} onChange={(value) => updateSpecs('dimensions', value)} />
            <Field label="Weight" value={activeDraft.specs.weight} onChange={(value) => updateSpecs('weight', value)} />
          </div>

          <section>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Protocols</h4>
              <button type="button" onClick={() => updateDraft({ protocols: [...activeDraft.protocols, { protocolKey: protocolOptions[0]?.key ?? '', direction: 'broadcast', details: '' }] })} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">Add</button>
            </div>
            <div className="mt-3 space-y-3">
              {activeDraft.protocols.map((protocol, index) => (
                <div key={`${protocol.protocolKey}-${index}`} className="flex flex-wrap items-start gap-3 rounded-2xl border border-slate-200 p-4">
                  <select
                    value={protocol.protocolKey}
                    onChange={(event) => updateDraft({ protocols: activeDraft.protocols.map((entry, entryIndex) => entryIndex === index ? { ...entry, protocolKey: event.target.value } : entry) })}
                    className={`${inputClass} min-w-[130px] flex-[1_1_150px]`}
                    aria-label="Protocol"
                  >
                    {protocolOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                  </select>
                  <input
                    value={protocol.direction}
                    onChange={(event) => updateDraft({ protocols: activeDraft.protocols.map((entry, entryIndex) => entryIndex === index ? { ...entry, direction: event.target.value } : entry) })}
                    className={`${inputClass} min-w-[120px] flex-[1_1_120px]`}
                    placeholder="broadcast"
                    aria-label="Direction"
                  />
                  <input
                    value={protocol.details}
                    onChange={(event) => updateDraft({ protocols: activeDraft.protocols.map((entry, entryIndex) => entryIndex === index ? { ...entry, details: event.target.value } : entry) })}
                    className={`${inputClass} min-w-[160px] flex-[999_1_220px]`}
                    placeholder="Optional notes"
                    aria-label="Details"
                  />
                  <button type="button" onClick={() => updateDraft({ protocols: activeDraft.protocols.filter((_, entryIndex) => entryIndex !== index) })} className="rounded-full border border-rose-200 px-4 py-3 text-xs font-medium text-rose-700 sm:ml-auto">Remove</button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-slate-900">Connectivity</h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {connectivityOptions.map((option) => {
                const active = activeDraft.connectivityKeys.includes(option.key);
                return (
                  <button key={option.key} type="button" onClick={() => updateDraft({ connectivityKeys: active ? activeDraft.connectivityKeys.filter((entry) => entry !== option.key) : [...activeDraft.connectivityKeys, option.key] })} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${active ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    <span>{option.label}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </section>

          {(activeDraft.category === 'anchor' || activeDraft.anchorProfile) && (
            <div className="grid gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:grid-cols-2">
              <Field label="Positioning Technology" value={(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!).positioningTechnology} onChange={(value) => updateDraft({ anchorProfile: { ...(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!), positioningTechnology: value } })} />
              <Field label="Positioning Accuracy" value={(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!).positioningAccuracy} onChange={(value) => updateDraft({ anchorProfile: { ...(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!), positioningAccuracy: value } })} />
              <Field label="Installation Height" value={(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!).installationHeight} onChange={(value) => updateDraft({ anchorProfile: { ...(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!), installationHeight: value } })} />
              <Field label="Mounting Mode" value={(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!).mountingMode} onChange={(value) => updateDraft({ anchorProfile: { ...(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!), mountingMode: value } })} />
              <Field label="Network Protocols" value={(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!).networkProtocols} onChange={(value) => updateDraft({ anchorProfile: { ...(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!), networkProtocols: value } })} />
              <div className="sm:col-span-2"><Field label="Commissioning Notes" value={(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!).commissioningNotes} onChange={(value) => updateDraft({ anchorProfile: { ...(activeDraft.anchorProfile ?? createPanelEmptyDraft().anchorProfile!), commissioningNotes: value } })} rows={3} /></div>
            </div>
          )}

          {(activeDraft.category === 'gateway' || activeDraft.gatewayProfile) && (
            <div className="grid gap-3 rounded-3xl bg-slate-950 p-5 sm:grid-cols-2">
              <Field label="Edge Mode" value={(activeDraft.gatewayProfile ?? createPanelEmptyDraft().gatewayProfile!).edgeComputingMode} onChange={(value) => updateDraft({ gatewayProfile: { ...(activeDraft.gatewayProfile ?? createPanelEmptyDraft().gatewayProfile!), edgeComputingMode: value } })} />
              <Field label="Configuration Method" value={(activeDraft.gatewayProfile ?? createPanelEmptyDraft().gatewayProfile!).configurationMethod} onChange={(value) => updateDraft({ gatewayProfile: { ...(activeDraft.gatewayProfile ?? createPanelEmptyDraft().gatewayProfile!), configurationMethod: value } })} />
              <div className="sm:col-span-2"><Field label="Configuration Notes" value={(activeDraft.gatewayProfile ?? createPanelEmptyDraft().gatewayProfile!).configurableParameters} onChange={(value) => updateDraft({ gatewayProfile: { ...(activeDraft.gatewayProfile ?? createPanelEmptyDraft().gatewayProfile!), configurableParameters: value } })} rows={3} /></div>
            </div>
          )}
        </div>
      ) : (
        <>
          {currentDevice ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {readTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      activeTab === tab.key ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {currentDevice.vendorProductUrl ? (
                    <div>
                      <a href={currentDevice.vendorProductUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                        Official product page
                      </a>
                    </div>
                  ) : null}

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Description</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{currentDevice.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReadOnlyField label="Category" value={currentDevice.category} />
                    <ReadOnlyField label="Status" value={currentDevice.status} />
                    <ReadOnlyField label="Manufacturer" value={currentDevice.manufacturer} />
                    <ReadOnlyField label="Model Number" value={currentDevice.modelNumber} />
                    <ReadOnlyField label="Subcategory" value={currentDevice.subcategory} />
                    <ReadOnlyField label="Role" value={currentDevice.role} />
                  </div>

                  <div className="grid gap-3">
                    <ReadOnlyPillGroup label="Connectivity" values={currentDevice.connectivity} />
                    <ReadOnlyPillGroup label="Applications" values={currentDevice.applications} />
                    <ReadOnlyPillGroup label="Business Tags" values={currentDevice.tags} />
                    <ReadOnlyPillGroup label="Protocols" values={currentDevice.protocols.map((protocol) => `${protocol.name} | ${protocol.direction}`)} />
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReadOnlyField label="Bluetooth Version" value={currentDevice.specs.bluetoothVersion} />
                    <ReadOnlyField label="Battery Lifespan" value={batteryLifeValue} />
                    <ReadOnlyField label="Battery Capacity" value={currentDevice.specs.batteryCapacity} />
                    <ReadOnlyField label="Power Supply" value={currentDevice.specs.powerSupply} multiline />
                    <ReadOnlyField label="Backhaul Type" value={currentDevice.specs.backhaulType} multiline />
                    <ReadOnlyField label="IP Rating" value={currentDevice.specs.ipRating} />
                    <ReadOnlyField label="Installation" value={currentDevice.specs.installation} multiline />
                    <ReadOnlyField label="Dimensions" value={currentDevice.specs.dimensions} />
                    <ReadOnlyField label="Weight" value={currentDevice.specs.weight} />
                    <ReadOnlyField label="Material" value={currentDevice.specs.material} />
                    <ReadOnlyField
                      label="Operating Temperature"
                      value={
                        currentDevice.specs.operatingTempMinC !== undefined || currentDevice.specs.operatingTempMaxC !== undefined
                          ? `${currentDevice.specs.operatingTempMinC ?? '?'} to ${currentDevice.specs.operatingTempMaxC ?? '?'} C`
                          : ''
                      }
                    />
                    <ReadOnlyField label="Indoor / Outdoor" value={currentDevice.specs.indoorOutdoorRating} multiline />
                    <ReadOnlyField label="Max Range Open Space" value={currentDevice.specs.maxSignalRangeOpenSpace} multiline />
                    <ReadOnlyField label="Max Range Real World" value={currentDevice.specs.maxSignalRangeRealWorld} multiline />
                    <ReadOnlyField label="PoE Support" value={formatBooleanValue(currentDevice.specs.poeSupport)} />
                    <ReadOnlyField label="PoE Standard" value={currentDevice.specs.poeStandard} />
                    <ReadOnlyField label="Ethernet Support" value={formatBooleanValue(currentDevice.specs.ethernetSupport)} />
                    <ReadOnlyField label="Wi-Fi Support" value={formatBooleanValue(currentDevice.specs.wifiSupport)} />
                    <ReadOnlyField label="Cellular Support" value={formatBooleanValue(currentDevice.specs.cellularSupport)} />
                    <ReadOnlyField label="Cellular Type" value={currentDevice.specs.cellularType} />
                    <ReadOnlyField label="GNSS Support" value={formatBooleanValue(currentDevice.specs.gnssSupport)} />
                    <ReadOnlyField label="LTE Category" value={currentDevice.specs.lteCategory} />
                    <ReadOnlyField label="Replaceable Battery" value={formatBooleanValue(currentDevice.specs.replaceableBattery)} />
                  </div>
                  <ReadOnlyPillGroup label="Sensors" values={currentDevice.specs.sensors ?? []} />
                </div>
              )}

              {activeTab === 'profiles' && (
                <div className="space-y-4">
                  {currentDevice.anchorProfile ? (
                    <div className="space-y-3 rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Anchor Profile</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ReadOnlyField label="Positioning Technology" value={currentDevice.anchorProfile.positioningTechnology} />
                        <ReadOnlyField label="Positioning Accuracy" value={currentDevice.anchorProfile.positioningAccuracy} />
                        <ReadOnlyField label="Installation Height" value={currentDevice.anchorProfile.installationHeight} />
                        <ReadOnlyField label="Coverage Area" value={currentDevice.anchorProfile.coverageArea} multiline />
                        <ReadOnlyField label="Network Protocols" value={currentDevice.anchorProfile.networkProtocols} multiline />
                        <ReadOnlyField label="Mounting Mode" value={currentDevice.anchorProfile.mountingMode} />
                        <ReadOnlyField label="Sync Requirement" value={currentDevice.anchorProfile.syncRequirement} multiline />
                        <ReadOnlyField label="Anchor Spacing" value={currentDevice.anchorProfile.recommendedAnchorSpacing} multiline />
                        <ReadOnlyField label="Anchor Density" value={currentDevice.anchorProfile.recommendedAnchorDensity} multiline />
                        <ReadOnlyField label="Line of Sight" value={currentDevice.anchorProfile.lineOfSightRequirement} multiline />
                        <ReadOnlyField label="Metal Interference" value={currentDevice.anchorProfile.metalInterferenceRisk} multiline />
                        <ReadOnlyField label="Positioning Engine" value={currentDevice.anchorProfile.positioningEngineLocation} />
                        <ReadOnlyField label="Raw Signal Forwarding" value={formatBooleanValue(currentDevice.anchorProfile.rawSignalForwarding)} />
                        <ReadOnlyField label="Cascade Supported" value={formatBooleanValue(currentDevice.anchorProfile.cascadeSupported)} />
                        <ReadOnlyField label="Installation Prerequisites" value={currentDevice.anchorProfile.installationPrerequisites} multiline />
                        <ReadOnlyField label="Commissioning Notes" value={currentDevice.anchorProfile.commissioningNotes} multiline />
                        <div className="sm:col-span-2">
                          <ReadOnlyField label="Notes" value={currentDevice.anchorProfile.notes} multiline />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {currentDevice.gatewayProfile ? (
                    <div className="space-y-3 rounded-[24px] bg-slate-950 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Gateway Profile</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ReadOnlyField label="Payload Format" value={currentDevice.gatewayProfile.payloadFormat} />
                        <ReadOnlyField label="Edge Mode" value={currentDevice.gatewayProfile.edgeComputingMode} />
                        <ReadOnlyField label="Configuration Method" value={currentDevice.gatewayProfile.configurationMethod} multiline />
                        <ReadOnlyField label="Central Engine Dependency" value={currentDevice.gatewayProfile.centralEngineDependency} multiline />
                        <ReadOnlyField label="Downlink Supported" value={formatBooleanValue(currentDevice.gatewayProfile.downlinkSupported)} />
                        <ReadOnlyField label="Calculates Coordinates Locally" value={formatBooleanValue(currentDevice.gatewayProfile.calculatesCoordinatesLocally)} />
                        <ReadOnlyField label="Forwards Raw Signals" value={formatBooleanValue(currentDevice.gatewayProfile.forwardsRawSignals)} />
                        <ReadOnlyField label="Refresh Rate Config" value={formatBooleanValue(currentDevice.gatewayProfile.supportsRefreshRateConfig)} />
                        <ReadOnlyField label="LED Control" value={formatBooleanValue(currentDevice.gatewayProfile.supportsLedControl)} />
                        <ReadOnlyField label="Buzzer Control" value={formatBooleanValue(currentDevice.gatewayProfile.supportsBuzzerControl)} />
                        <ReadOnlyField label="Node-RED Ready" value={formatBooleanValue(currentDevice.gatewayProfile.nodeRedIntegrationReady)} />
                        <ReadOnlyField label="MQTT Topic Example" value={currentDevice.gatewayProfile.mqttTopicExample} multiline />
                        <ReadOnlyField label="MQTT Payload Example" value={currentDevice.gatewayProfile.mqttPayloadExample} multiline />
                        <ReadOnlyField label="HTTPS Endpoint" value={currentDevice.gatewayProfile.httpsEndpoint} multiline />
                        <ReadOnlyField label="WebSocket Endpoint" value={currentDevice.gatewayProfile.websocketEndpoint} multiline />
                        <div className="sm:col-span-2">
                          <ReadOnlyField label="Configuration Notes" value={currentDevice.gatewayProfile.configurableParameters} multiline />
                        </div>
                        <div className="sm:col-span-2">
                          <ReadOnlyField label="Notes" value={currentDevice.gatewayProfile.notes} multiline />
                        </div>
                      </div>
                      <ReadOnlyPillGroup label="Uplink Protocols" values={currentDevice.gatewayProfile.uplinkProtocols} />
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === 'variants' && currentDevice.variants?.length ? <DeviceVariantComparison device={currentDevice} /> : null}

              {activeTab === 'documents' && (
                <section>
                  <h4 className="text-sm font-semibold text-slate-900">Documents</h4>
                  <div className="mt-3 space-y-3">
                    {currentDevice.documents.length ? currentDevice.documents.map((document) => (
                      <a key={`${document.label}-${document.path}`} href={toFileHref(document.path)} target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                        <span className="block font-medium text-slate-950">{document.label}</span>
                        <span className="mt-1 block break-all text-xs text-slate-500">{document.path}</span>
                      </a>
                    )) : <p className="text-sm text-slate-500">No documents mapped yet.</p>}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </>
      )}
      </div>

      {isEditing ? (
      <section className="mt-6">
        <h4 className="text-sm font-semibold text-slate-900">Documents</h4>
        <div className="mt-3 space-y-3">
          {currentDevice?.documents.length ? currentDevice.documents.map((document) => (
            <a key={`${document.label}-${document.path}`} href={toFileHref(document.path)} target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <span className="block font-medium text-slate-950">{document.label}</span>
              <span className="mt-1 block break-all text-xs text-slate-500">{document.path}</span>
            </a>
          )) : <p className="text-sm text-slate-500">No documents mapped yet.</p>}
        </div>
      </section>
      ) : null}
    </aside>
  );
}

export default DeviceDetailPanel;
