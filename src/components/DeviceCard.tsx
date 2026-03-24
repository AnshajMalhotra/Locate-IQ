import { Device } from '../data/mockDevices';

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

  return (
    <article
      className={`rounded-[24px] border p-5 transition ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50/70 shadow-[0_24px_60px_-36px_rgba(5,150,105,0.45)]'
          : 'border-slate-200 bg-white shadow-[0_18px_60px_-35px_rgba(15,23,42,0.32)] hover:-translate-y-0.5 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{device.category}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{device.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {device.manufacturer}
            {device.subcategory ? ` | ${device.subcategory}` : ''}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            device.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {device.status}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">{device.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {highlights.slice(0, 4).map((item) => (
          <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {item}
          </span>
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Protocols</dt>
          <dd className="mt-2 font-medium text-slate-900">{device.protocolNames.slice(0, 3).join(', ') || 'Not mapped'}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Connectivity</dt>
          <dd className="mt-2 font-medium text-slate-900">{device.connectivity.slice(0, 3).join(', ') || 'Not mapped'}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {device.applications.slice(0, 3).map((application) => (
          <span key={application} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            {application}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          onClick={() => onSelect(device)}
        >
          Open details
        </button>
        {device.vendorProductUrl ? (
          <a
            href={device.vendorProductUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Vendor page
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default DeviceCard;
