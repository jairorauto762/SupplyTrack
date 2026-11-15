import { Link } from 'react-router-dom';

export default function ItemsPanel({ items, loading, error, onRefresh, onAdd }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Inventory management</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">All inventory items</h2>
          <p className="mt-1 text-sm text-slate-500">Open an item to edit details, manage stock, and review its movement history.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onRefresh} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh items</button>
          <button type="button" onClick={onAdd} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Add item</button>
        </div>
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {loading ? (
        <div aria-label="Loading inventory" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading inventory…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No inventory items have been added yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} to={`/custodian/items/${item.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-600/30">
              <div className="flex h-44 items-center justify-center bg-slate-100">
                {item.photo_url ? <img src={item.photo_url} alt="" className="h-full w-full object-contain p-3" /> : <span className="text-sm text-slate-400">No photo</span>}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{item.name}</p><p className="mt-1 font-mono text-xs text-slate-500">{item.item_code}</p></div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{item.status}</span>
                </div>
                <p className="text-sm text-slate-500">{item.category?.name || 'Uncategorized'}</p>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm"><span className="text-slate-500">Stock</span><span className="font-semibold text-slate-900">{item.stock_quantity}</span></div>
                <p className="text-xs font-semibold text-brand-700">Manage item →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
