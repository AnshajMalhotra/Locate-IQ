import { Device, getDeviceUiCategoryLabel } from '../data/mockDevices';

interface DeviceCardProps {
  device: Device;
  isSelected: boolean;
  onSelect: (device: Device) => void;
}

function DeviceCard({ device, isSelected, onSelect }: DeviceCardProps) {
  const highlights = [
    device.specs.ipRating,
    device.specs.backhaulType,
    device.gatewayProfile?.edgeComputingMode,
    device.anchorProfile?.positioningTechnology,
    device.variants?.length ? `${device.variants.length} variants` : undefined,
  ].filter(Boolean) as string[];

  const categoryLabel = getDeviceUiCategoryLabel(device);

  return (
    <article
      className={`group rounded-[28px] border p-5 transition ${
        isSelected
          ? 'border-emerald-500/60 bg-slate-800/90 shadow-[0_24px_70px_-40px_rgba(16,185,129,0.35)]'
          : 'border-slate-800 bg-slate-800/75 shadow-[0_22px_70px_-42px_rgba(2,6,23,0.95)] hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-800/95'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-xl bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {categoryLabel}
          </span>
          <h3 className="mt-4 text-[1.65rem] font-semibold tracking-tight text-white">{device.title}</h3>
          <p className="mt-2 text-sm text-slate-400">
            <span className="font-medium text-slate-300">{device.manufacturer}</span>
            {device.modelNumber ? <span>{`  •  ${device.modelNumber}`}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          <span className={`h-2.5 w-2.5 rounded-full ${device.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {device.status}
        </div>
      </div>

      <p className="mt-6 min-h-[72px] text-base leading-7 text-slate-300">{device.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {highlights.slice(0, 4).map((item) => (
          <span key={item} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
            {item}
          </span>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-700/70 pt-4">
        <div className="flex flex-wrap gap-2">
          {device.connectivity.slice(0, 4).map((entry) => (
            <span key={entry} className="rounded-md border border-slate-700 bg-[#0a1326] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200">
              {entry}
            </span>
          ))}
          {!device.connectivity.length ? (
            <span className="rounded-md border border-slate-700 bg-[#0a1326] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Unmapped
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {device.applications.slice(0, 3).map((application) => (
          <span key={application} className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            {application}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-500/50 hover:text-emerald-200"
          onClick={() => onSelect(device)}
        >
          Open details
        </button>
        {device.vendorProductUrl ? (
          <a
            href={device.vendorProductUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900"
          >
            Vendor page
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default DeviceCard;
