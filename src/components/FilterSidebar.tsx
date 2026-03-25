interface FilterState {
  categories: string[];
  manufacturers: string[];
  applications: string[];
  protocols: string[];
  connectivity: string[];
  tags: string[];
  batteryLife: string[];
  ipRatings: string[];
  edgeModes: string[];
  status: string[];
  requirePoe: boolean;
  requireEthernet: boolean;
  requireWifi: boolean;
  requireCellular: boolean;
  requireGnss: boolean;
  requireLocalCompute: boolean;
}

interface FilterOptions {
  categories: string[];
  manufacturers: string[];
  applications: string[];
  protocols: string[];
  connectivity: string[];
  tags: string[];
  batteryLife: string[];
  ipRatings: string[];
  edgeModes: string[];
  statuses: string[];
}

interface FilterSidebarProps {
  filters: FilterState;
  options: FilterOptions;
  onToggleMulti: (key: keyof FilterState, value: string) => void;
  onToggleBoolean: (key: keyof FilterState) => void;
  onReset: () => void;
}

function renderChipGroup(
  values: string[],
  selected: string[],
  onToggle: (value: string) => void,
  emptyLabel: string,
) {
  if (!values.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => {
        const active = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}

function renderToggle(label: string, active: boolean, onToggle: () => void) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${
        active
          ? 'border-emerald-500 bg-emerald-500/12 text-emerald-200'
          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
      }`}
    >
      <span>{label}</span>
      <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
    </button>
  );
}

function FilterSidebar({ filters, options, onToggleMulti, onToggleBoolean, onReset }: FilterSidebarProps) {
  return (
    <aside className="space-y-5 rounded-[28px] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_24px_70px_-40px_rgba(2,6,23,0.95)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Filters</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Deterministic constraints</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          Reset
        </button>
      </div>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Hard Requirements</h4>
        <div className="grid gap-2">
          {renderToggle('PoE required', filters.requirePoe, () => onToggleBoolean('requirePoe'))}
          {renderToggle('Ethernet required', filters.requireEthernet, () => onToggleBoolean('requireEthernet'))}
          {renderToggle('Wi-Fi required', filters.requireWifi, () => onToggleBoolean('requireWifi'))}
          {renderToggle('Cellular required', filters.requireCellular, () => onToggleBoolean('requireCellular'))}
          {renderToggle('GNSS required', filters.requireGnss, () => onToggleBoolean('requireGnss'))}
          {renderToggle('Local compute preferred', filters.requireLocalCompute, () => onToggleBoolean('requireLocalCompute'))}
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Category</h4>
        {renderChipGroup(options.categories, filters.categories, (value) => onToggleMulti('categories', value), 'No categories loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Protocol Stack</h4>
        {renderChipGroup(options.protocols, filters.protocols, (value) => onToggleMulti('protocols', value), 'No protocols loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Connectivity</h4>
        {renderChipGroup(options.connectivity, filters.connectivity, (value) => onToggleMulti('connectivity', value), 'No connectivity options loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Applications</h4>
        {renderChipGroup(options.applications, filters.applications, (value) => onToggleMulti('applications', value), 'No applications loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Business Tags</h4>
        {renderChipGroup(options.tags, filters.tags, (value) => onToggleMulti('tags', value), 'No business tags loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Manufacturer</h4>
        {renderChipGroup(options.manufacturers, filters.manufacturers, (value) => onToggleMulti('manufacturers', value), 'No manufacturers loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">IP Rating</h4>
        {renderChipGroup(options.ipRatings, filters.ipRatings, (value) => onToggleMulti('ipRatings', value), 'No IP ratings loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Battery Lifespan</h4>
        {renderChipGroup(options.batteryLife, filters.batteryLife, (value) => onToggleMulti('batteryLife', value), 'No battery profile data loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Gateway Logic</h4>
        {renderChipGroup(options.edgeModes, filters.edgeModes, (value) => onToggleMulti('edgeModes', value), 'No gateway profiles loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Lifecycle</h4>
        {renderChipGroup(options.statuses, filters.status, (value) => onToggleMulti('status', value), 'No status values loaded')}
      </section>
    </aside>
  );
}

export default FilterSidebar;
