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

  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
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

      {isEditing ? (
        <div className="mt-6 space-y-6">
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
          {currentDevice?.vendorProductUrl ? <div className="mt-4"><a href={currentDevice.vendorProductUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Official product page</a></div> : null}
          <p className="mt-4 text-sm leading-6 text-slate-700">{currentDevice?.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Connectivity</p><p className="mt-2 text-sm font-medium text-slate-900">{currentDevice?.connectivity.join(', ') || 'Not mapped'}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Applications</p><p className="mt-2 text-sm font-medium text-slate-900">{currentDevice?.applications.join(', ') || 'Not mapped'}</p></div>
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">{currentDevice?.protocols.map((protocol) => `${protocol.name} | ${protocol.direction}`).join(', ') || 'No protocols mapped'}</div>
        </>
      )}

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
    </aside>
  );
}

export default DeviceDetailPanel;
