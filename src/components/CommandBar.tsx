interface CommandBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  stats: {
    devices: number;
    gateways: number;
    anchors: number;
    tags: number;
    beacons: number;
  };
  onOpenAdvancedFilters: () => void;
  onAddDevice: () => void;
  canAddDevice: boolean;
}

function CommandBar({ searchQuery, onSearchChange, stats, onOpenAdvancedFilters, onAddDevice, canAddDevice }: CommandBarProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur xl:left-64">
      <div className="flex h-16 items-center justify-between gap-4 px-5 xl:px-6">
        <div className="relative flex-1 max-w-3xl">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 21L16.65 16.65M10.5 18A7.5 7.5 0 1 1 10.5 3a7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search hardware, protocols, specs (e.g., 'PoE indoor anchor')..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-11 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 gap-1 sm:flex">
            <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-500">Ctrl</kbd>
            <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-500">K</kbd>
          </div>
        </div>

        <div className="hidden items-center gap-4 text-xs font-mono text-slate-400 lg:flex">
          <span>DEV: <span className="text-slate-200">{stats.devices}</span></span>
          <span>GTW: <span className="text-slate-200">{stats.gateways}</span></span>
          <span>ANC: <span className="text-slate-200">{stats.anchors}</span></span>
          <span>TAG: <span className="text-slate-200">{stats.tags}</span></span>
          <span>BCN: <span className="text-slate-200">{stats.beacons}</span></span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAdvancedFilters}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            Advanced
          </button>
          {canAddDevice ? (
            <button
              type="button"
              onClick={onAddDevice}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 shadow-[0_0_10px_rgba(34,197,94,0.25)] transition hover:bg-emerald-400"
            >
              Add Device
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default CommandBar;
