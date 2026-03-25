interface HardwareSearchProps {
  connectivityOptions: string[];
  batteryOptions: string[];
  useCaseOptions: string[];
  statusOptions: string[];
  selectedConnectivity: string;
  selectedBattery: string;
  selectedUseCase: string;
  selectedStatus: string;
  onConnectivityChange: (value: string) => void;
  onBatteryChange: (value: string) => void;
  onUseCaseChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  selectedFilters: Array<{ key: string; label: string }>;
  onRemoveFilter: (key: string) => void;
  onResetFilters: () => void;
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex min-w-[160px] flex-1 flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All {label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6l6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </label>
  );
}

function HardwareSearch({
  connectivityOptions,
  batteryOptions,
  useCaseOptions,
  statusOptions,
  selectedConnectivity,
  selectedBattery,
  selectedUseCase,
  selectedStatus,
  onConnectivityChange,
  onBatteryChange,
  onUseCaseChange,
  onStatusChange,
  selectedFilters,
  onRemoveFilter,
  onResetFilters,
}: HardwareSearchProps) {
  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap gap-4">
        <FilterDropdown label="Connectivity" value={selectedConnectivity} onChange={onConnectivityChange} options={connectivityOptions} />
        <FilterDropdown label="Battery" value={selectedBattery} onChange={onBatteryChange} options={batteryOptions} />
        <FilterDropdown label="Use Case" value={selectedUseCase} onChange={onUseCaseChange} options={useCaseOptions} />
        <FilterDropdown label="Status" value={selectedStatus} onChange={onStatusChange} options={statusOptions} />
      </div>

      {selectedFilters.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {selectedFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => onRemoveFilter(filter.key)}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
            >
              {filter.label} x
            </button>
          ))}
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-full bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-600"
          >
            Reset Filters
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default HardwareSearch;
