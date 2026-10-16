import StockBadge from './StockBadge';
import StatusBadge from './StatusBadge';

function ItemIdentity({ item }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-900">{item.name}</p>
      {item.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.description}</p>}
      <p className="mt-1 font-mono text-[11px] font-medium tracking-wide text-slate-400">{item.item_code}</p>
    </div>
  );
}

function EmptyState({ filtered }) {
  return (
    <div className="px-5 py-14 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9ZM4 7.5l8 4.5m0 0 8-4.5M12 12v9" />
        </svg>
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{filtered ? 'No matching items' : 'No inventory yet'}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {filtered ? 'Try changing or clearing your filters to see more items.' : 'Inventory items will appear here when they are added.'}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div aria-label="Loading inventory" className="space-y-3 p-4 sm:p-6">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

function ItemCard({ item }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <ItemIdentity item={item} />
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Category</p>
          <p className="mt-1 truncate text-sm font-medium text-slate-700">{item.category?.name || 'Uncategorized'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Quantity</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{item.stock_quantity}</p>
        </div>
      </div>
      <div className="mt-3">
        <StockBadge item={item} />
      </div>
    </article>
  );
}

export default function InventoryTable({ items, loading, filtered, error, onRetry, onRequest }) {
  return (
    <section aria-label="Inventory list" aria-busy={loading} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {error ? (
        <div role="alert" className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="text-sm font-semibold text-rose-800">Inventory could not be loaded</h3>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
          </div>
          <button type="button" onClick={onRetry} className="min-h-10 rounded-xl border border-rose-200 px-3.5 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-600/30">
            Try again
          </button>
        </div>
      ) : loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState filtered={filtered} />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">Item</th>
                  <th scope="col" className="px-5 py-4">Category</th>
                  <th scope="col" className="px-5 py-4">Quantity</th>
                  <th scope="col" className="px-5 py-4">Stock level</th>
                  <th scope="col" className="px-5 py-4">Item status</th>
                  {onRequest && <th scope="col" className="px-5 py-4">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="max-w-80 px-6 py-4"><ItemIdentity item={item} /></td>
                    <td className="px-5 py-4 text-slate-600">{item.category?.name || 'Uncategorized'}</td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-slate-900">{item.stock_quantity}</td>
                    <td className="px-5 py-4"><StockBadge item={item} /></td>
                    <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                    {onRequest && (
                      <td className="px-5 py-4">
                        <button type="button" disabled={item.stock_quantity < 1 || item.status !== 'available'} onClick={() => onRequest(item)} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">
                          Add to request
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-3 sm:p-4 md:hidden">
            {items.map((item) => (
              <div key={item.id} className="space-y-2">
                <ItemCard item={item} />
                {onRequest && (
                  <button type="button" disabled={item.stock_quantity < 1 || item.status !== 'available'} onClick={() => onRequest(item)} className="min-h-10 w-full rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">
                    Add to request
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
