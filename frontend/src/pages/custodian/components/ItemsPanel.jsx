import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import printPage from '../../../utils/printPage';

function RestockDialog({ item, onClose, onRestocked }) {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submitRestock = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await api.post(`/custodian/items/${item.id}/restock`, {
        quantity: Number(quantity),
        notes,
      });
      onRestocked(response.data.data);
      onClose();
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : requestError.response?.data?.message || 'Could not add stock to this item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <form onSubmit={submitRestock} role="dialog" aria-modal="true" aria-labelledby="restock-title" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div>
          <h2 id="restock-title" className="text-lg font-bold text-slate-950">Restock {item.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Current stock: {item.stock_quantity}</p>
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <label className="block text-sm font-medium text-slate-700">
          Quantity to add
          <input autoFocus required type="number" min="1" step="1" max="2147483647" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Notes (optional)
          <input maxLength="255" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving || !quantity} className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{saving ? 'Saving…' : 'Add stock'}</button>
        </div>
      </form>
    </div>
  );
}

export default function ItemsPanel({ items, loading, error, onRefresh, onAdd, onRestocked }) {
  const [restockItem, setRestockItem] = useState(null);

  return (
    <>
      <section className="print-target print-inventory-target space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Inventory management</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">All inventory items</h2>
            <p className="mt-1 text-sm text-slate-500">Open an item to edit details, manage stock, and review its movement history.</p>
          </div>
          <div className="print-hidden flex gap-2">
            <button type="button" disabled={loading || Boolean(error)} onClick={() => printPage('inventory')} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">Print inventory list</button>
            <button type="button" onClick={onRefresh} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh items</button>
            <button type="button" onClick={onAdd} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Add item</button>
          </div>
        </div>
        {error && <p role="alert" className="print-hidden rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
        {loading ? (
          <div aria-label="Loading inventory" className="print-hidden rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading inventory…</div>
        ) : items.length === 0 ? (
          <div className="print-hidden rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No inventory items have been added yet.</div>
        ) : (
          <div className="print-hidden grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Link to={`/custodian/items/${item.id}`} className="block transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-600/30">
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
                <div className="px-4 pb-4">
                  <button type="button" onClick={() => setRestockItem(item)} className="w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100">Restock</button>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && (
          <div className="hidden overflow-x-auto print:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-400 text-xs uppercase tracking-wide text-slate-600">
                  <th className="px-2 py-2">Item</th>
                  <th className="px-2 py-2">Price</th>
                  <th className="px-2 py-2">Stock</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="px-2 py-2 font-medium">{item.name}</td>
                    <td className="px-2 py-2">{Number(item.price).toLocaleString(undefined, { style: 'currency', currency: 'PHP' })}</td>
                    <td className="px-2 py-2">{item.stock_quantity}</td>
                    <td className="px-2 py-2 capitalize">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {restockItem && (
        <RestockDialog
          item={restockItem}
          onClose={() => setRestockItem(null)}
          onRestocked={onRestocked}
        />
      )}
    </>
  );
}
