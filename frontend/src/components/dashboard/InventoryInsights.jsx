import { Link } from 'react-router-dom';

export default function InventoryInsights({ summary, lowStockItems: lowStockItemsOverride, itemLinkPrefix = '/inventory/items' }) {
  const lowStockItems = lowStockItemsOverride ?? summary?.low_stock_items ?? [];
  const topRequestedItems = summary?.top_requested_items || [];

  return (
    <section className="grid gap-4 lg:grid-cols-2" aria-label="Inventory insights">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Low-stock items</h2>
            <p className="mt-1 text-sm text-slate-500">Items at or below minimum; showing up to five.</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">{Number(summary?.low_stock ?? lowStockItems.length).toLocaleString()}</span>
        </div>
        {lowStockItems.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No items are currently low in stock.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {lowStockItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <Link to={`${itemLinkPrefix}/${item.id}`} className="font-semibold text-blue-800 hover:underline">{item.name}</Link>
                <span className="shrink-0 text-sm text-slate-600">{item.stock_quantity} left · minimum {item.min_threshold}</span>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Most requested</h2>
          <p className="mt-1 text-sm text-slate-500">Ranked by the number of requests, excluding declined and cancelled requests.</p>
        </div>
        {topRequestedItems.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            {Number(summary?.requests_count ?? 0) > 0
              ? 'Requests exist, but no item-level requests are available to rank.'
              : 'No supply requests have been submitted yet.'}
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-slate-100">
            {topRequestedItems.map((entry, index) => (
              <li key={entry.item_id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-800">{index + 1}</span>
                  {entry.item ? (
                    <Link to={`${itemLinkPrefix}/${entry.item.id}`} className="truncate font-semibold text-blue-800 hover:underline">{entry.item.name}</Link>
                  ) : (
                    <span className="truncate font-semibold text-slate-700">Item unavailable</span>
                  )}
                </div>
                <span className="shrink-0 text-right text-sm text-slate-600">{entry.request_count} {entry.request_count === 1 ? 'request' : 'requests'} · {entry.quantity_requested} units</span>
              </li>
            ))}
          </ol>
        )}
      </article>
    </section>
  );
}
