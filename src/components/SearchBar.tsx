interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
  canAddDevice: boolean;
  onAddDevice: () => void;
}

const searchSuggestions = ['PoE indoor anchor for navigation', 'Battery beacon with temperature sensor', 'Outdoor cellular gateway with GNSS'];

function SearchBar({ value, onChange, resultCount, totalCount, canAddDevice, onAddDevice }: SearchBarProps) {
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

      <div className="flex flex-col gap-3 sm:flex-row">
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
