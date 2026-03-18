interface FilterState {
  categories: string[];
  manufacturers: string[];
  applications: string[];
  protocols: string[];
  connectivity: string[];
  tags: string[];
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
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
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
          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-emerald-600' : 'bg-slate-300'}`} />
    </button>
  );
}

function FilterSidebar({ filters, options, onToggleMulti, onToggleBoolean, onReset }: FilterSidebarProps) {
  return (
    <aside className="space-y-5 rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Filters</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Deterministic constraints</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Reset
        </button>
      </div>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Hard Requirements</h4>
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
        <h4 className="text-sm font-semibold text-slate-900">Category</h4>
        {renderChipGroup(options.categories, filters.categories, (value) => onToggleMulti('categories', value), 'No categories loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Protocol Stack</h4>
        {renderChipGroup(options.protocols, filters.protocols, (value) => onToggleMulti('protocols', value), 'No protocols loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Connectivity</h4>
        {renderChipGroup(options.connectivity, filters.connectivity, (value) => onToggleMulti('connectivity', value), 'No connectivity options loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Applications</h4>
        {renderChipGroup(options.applications, filters.applications, (value) => onToggleMulti('applications', value), 'No applications loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Business Tags</h4>
        {renderChipGroup(options.tags, filters.tags, (value) => onToggleMulti('tags', value), 'No business tags loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Manufacturer</h4>
        {renderChipGroup(options.manufacturers, filters.manufacturers, (value) => onToggleMulti('manufacturers', value), 'No manufacturers loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">IP Rating</h4>
        {renderChipGroup(options.ipRatings, filters.ipRatings, (value) => onToggleMulti('ipRatings', value), 'No IP ratings loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Gateway Logic</h4>
        {renderChipGroup(options.edgeModes, filters.edgeModes, (value) => onToggleMulti('edgeModes', value), 'No gateway profiles loaded')}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Lifecycle</h4>
        {renderChipGroup(options.statuses, filters.status, (value) => onToggleMulti('status', value), 'No status values loaded')}
      </section>
    </aside>
  );
}

export default FilterSidebar;
