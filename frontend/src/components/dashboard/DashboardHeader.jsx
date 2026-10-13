function BoxIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5m8 4.5v9" />
    </svg>
  );
}

export default function DashboardHeader({ user, onLogout }) {
  const initials = user.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'ST';

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm shadow-blue-900/20">
            <BoxIcon />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-slate-950">SPC SupplyTrack</p>
            <p className="text-xs font-medium text-slate-500">Inventory management</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-800 ring-1 ring-inset ring-blue-100">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-900 sm:max-w-56">
                {user.name || 'Account'}
              </p>
              <p className="text-xs capitalize text-slate-500">{user.role || 'User'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
