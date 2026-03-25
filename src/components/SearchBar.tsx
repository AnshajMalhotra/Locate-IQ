interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
  canAddDevice: boolean;
  onAddDevice: () => void;
  categoryOptions: string[];
  connectivityOptions: string[];
  applicationOptions: string[];
  batteryLifeOptions: string[];
  statusOptions: string[];
  selectedCategory: string;
  selectedConnectivity: string;
  selectedApplication: string;
  selectedBatteryLife: string;
  selectedStatus: string;
  onCategoryChange: (value: string) => void;
  onConnectivityChange: (value: string) => void;
  onApplicationChange: (value: string) => void;
  onBatteryLifeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onOpenAdvancedFilters: () => void;
  activeFilterCount: number;
  selectedFilters: Array<{ key: string; label: string }>;
  onRemoveFilter: (key: string) => void;
  onResetFilters: () => void;
}

const searchSuggestions = ['PoE indoor anchor for navigation', 'Battery beacon with temperature sensor', 'Outdoor cellular gateway with GNSS'];

function QuickSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-[150px] flex-1">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:bg-slate-950"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchBar({
  value,
  onChange,
  resultCount,
  totalCount,
  canAddDevice,
  onAddDevice,
  categoryOptions,
  connectivityOptions,
  applicationOptions,
  batteryLifeOptions,
  statusOptions,
  selectedCategory,
  selectedConnectivity,
  selectedApplication,
  selectedBatteryLife,
  selectedStatus,
  onCategoryChange,
  onConnectivityChange,
  onApplicationChange,
  onBatteryLifeChange,
  onStatusChange,
  onOpenAdvancedFilters,
  activeFilterCount,
  selectedFilters,
  onRemoveFilter,
  onResetFilters,
}: SearchBarProps) {
  return (
    <section className="rounded-[30px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_30px_80px_-40px_rgba(2,6,23,0.95)] backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 21L16.65 16.65M10.5 18A7.5 7.5 0 1 1 10.5 3a7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <input
              type="text"
              value={value}
              placeholder="Search hardware, protocols, specs (e.g., 'PoE indoor anchor')..."
              className="w-full rounded-2xl border border-slate-700/80 bg-[#091122] px-12 py-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:bg-slate-950"
              onChange={(event) => onChange(event.target.value)}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Ctrl
              </span>
              <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                K
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs font-medium tracking-[0.18em] text-slate-400">
              DEV: <span className="text-slate-100">{totalCount}</span>
            </div>
            <button
              type="button"
              onClick={onOpenAdvancedFilters}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
            >
              Advanced
            </button>
            {canAddDevice ? (
              <button
                type="button"
                onClick={onAddDevice}
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                + Add Device
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Hardware Inventory</h2>
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-slate-200">{resultCount}</span> items found
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[26px] border border-slate-800 bg-slate-900/70 p-4">
        <div className="grid gap-3 lg:grid-cols-5">
          <QuickSelect label="Category" value={selectedCategory} options={categoryOptions} onChange={onCategoryChange} />
          <QuickSelect label="Connectivity" value={selectedConnectivity} options={connectivityOptions} onChange={onConnectivityChange} />
          <QuickSelect label="Battery" value={selectedBatteryLife} options={batteryLifeOptions} onChange={onBatteryLifeChange} />
          <QuickSelect label="Use Case" value={selectedApplication} options={applicationOptions} onChange={onApplicationChange} />
          <QuickSelect label="Status" value={selectedStatus} options={statusOptions} onChange={onStatusChange} />
        </div>
      </div>

      {selectedFilters.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Active Filters</span>
          {selectedFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onRemoveFilter(filter.key)}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
            >
              {filter.label} x
            </button>
          ))}
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
          >
            Clear all
          </button>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-sm text-slate-400">Use the command bar for quick narrowing, then open Advanced for deeper constraints.</p>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">{activeFilterCount} active</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Suggested</span>
        {searchSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onChange(suggestion)}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Natural-language search is already live. This command bar is also the right place to plug in an AI search assistant later.
      </p>
    </section>
  );
}

export default SearchBar;
