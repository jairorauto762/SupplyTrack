const metrics = [
  {
    key: 'total_items',
    label: 'Total items',
    description: 'Tracked in inventory',
    accent: 'bg-blue-600',
    iconColor: 'bg-blue-50 text-blue-700',
    icon: 'M4 7h16M4 12h16M4 17h16',
  },
  {
    key: 'in_stock',
    label: 'In stock',
    description: 'Above minimum quantity',
    accent: 'bg-emerald-500',
    iconColor: 'bg-emerald-50 text-emerald-700',
    icon: 'm5 12 4 4L19 6',
  },
  {
    key: 'low_stock',
    label: 'Low stock',
    description: 'At or below minimum',
    accent: 'bg-amber-500',
    iconColor: 'bg-amber-50 text-amber-700',
    icon: 'M12 9v4m0 4h.01M10.3 4.9 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z',
  },
  {
    key: 'out_of_stock',
    label: 'Out of stock',
    description: 'Needs replenishment',
    accent: 'bg-rose-500',
    iconColor: 'bg-rose-50 text-rose-700',
    icon: 'M6 6l12 12M18 6 6 18',
  },
];

export default function InventorySummary({ summary, loading }) {
  return (
    <section aria-label="Inventory summary" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.key}
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]"
        >
          <div className={`absolute inset-x-0 top-0 h-1 ${metric.accent}`} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-600">{metric.label}</p>
              {loading ? (
                <div aria-label="Loading" className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {Number(summary?.[metric.key] ?? 0).toLocaleString()}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">{metric.description}</p>
            </div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metric.iconColor}`}>
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={metric.icon} />
              </svg>
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}
