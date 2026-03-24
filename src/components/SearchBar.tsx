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
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
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
    <section className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Selection Workspace</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">Find valid hardware without guessing</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Search by business need, hardware model, protocol, integration keyword, or deployment constraint. You can also describe the outcome you want in plain language.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-950">{resultCount}</span> matched of {totalCount} devices
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        <QuickSelect label="Category" value={selectedCategory} options={categoryOptions} onChange={onCategoryChange} />
        <QuickSelect label="Connectivity" value={selectedConnectivity} options={connectivityOptions} onChange={onConnectivityChange} />
        <QuickSelect label="Battery Lifespan" value={selectedBatteryLife} options={batteryLifeOptions} onChange={onBatteryLifeChange} />
        <QuickSelect label="Use Case" value={selectedApplication} options={applicationOptions} onChange={onApplicationChange} />
        <QuickSelect label="Status" value={selectedStatus} options={statusOptions} onChange={onStatusChange} />
        <div className="flex flex-col justify-end gap-2">
          <button
            type="button"
            onClick={onOpenAdvancedFilters}
            className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Advanced Filters
          </button>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-medium text-slate-600">
            {activeFilterCount} active
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={value}
          placeholder="Try: PoE indoor anchor, battery beacon with temp sensor, outdoor cellular gateway..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          onChange={(event) => onChange(event.target.value)}
        />
        {canAddDevice ? (
          <button
            type="button"
            onClick={onAddDevice}
            className="shrink-0 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Add device
          </button>
        ) : null}
      </div>

      {selectedFilters.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active Filters</span>
          {selectedFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onRemoveFilter(filter.key)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {filter.label} x
            </button>
          ))}
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">AI-ready search lane</span>
        {searchSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onChange(suggestion)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Natural-language matching is live in the catalog search. A true LLM copilot can sit on top of this later once we place a backend proxy in front of NocoDB.
      </p>
    </section>
  );
}

export default SearchBar;
