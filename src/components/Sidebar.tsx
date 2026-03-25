interface SidebarItem {
  key: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
  connectionStatus: 'idle' | 'checking' | 'connected' | 'failed';
}

function SidebarIcon({ kind }: { kind: string }) {
  if (kind === 'gateway') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M3 17h18M6 14a6 6 0 0 1 12 0M9 11a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'anchor') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M12 3v11M8 6a4 4 0 1 0 8 0a4 4 0 0 0-8 0Zm-4 9c1.5 3 4.2 5 8 6c3.8-1 6.5-3 8-6M7 15h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'tag') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M11 3H5v6l8.5 8.5a2.1 2.1 0 0 0 3 0l4-4a2.1 2.1 0 0 0 0-3L11 3ZM8.5 8.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'beacon') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M12 20a2 2 0 1 0 0-4a2 2 0 0 0 0 4ZM7 13a7 7 0 0 1 10 0M4 10a11 11 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function getConnectionCopy(connectionStatus: SidebarProps['connectionStatus']) {
  if (connectionStatus === 'checking') return 'Syncing inventory tables';
  if (connectionStatus === 'connected') return 'Sync: Live';
  if (connectionStatus === 'failed') return 'Fallback dataset active';
  return 'Waiting for credentials';
}

function Sidebar({ items, connectionStatus }: SidebarProps) {
  return (
    <aside className="hidden xl:flex xl:fixed xl:inset-y-0 xl:left-0 xl:z-30 xl:w-64 xl:flex-col xl:border-r xl:border-slate-800 xl:bg-slate-950/95 xl:backdrop-blur">
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <span className="text-sm font-bold uppercase tracking-[0.22em] text-slate-100">Locate-IQ</span>
        </div>
      </div>

      <div className="flex-1 space-y-1 px-3 py-6">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Hardware Inventory</p>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className={`mt-2 flex w-full items-center justify-between rounded-xl border-l-2 px-3 py-2.5 text-left transition ${
              item.active
                ? 'border-emerald-500 bg-slate-800/80 text-emerald-300'
                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={item.active ? 'text-emerald-400' : 'text-slate-500'}>
                <SidebarIcon kind={item.key} />
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <span className={`rounded-md px-2 py-0.5 text-xs font-mono ${item.active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-md bg-slate-800 text-slate-400">DB</span>
            NocoDB Connected
            <span className={`h-1.5 w-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400' : connectionStatus === 'failed' ? 'bg-amber-400' : 'bg-slate-500'}`} />
          </div>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">{getConnectionCopy(connectionStatus)}</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
