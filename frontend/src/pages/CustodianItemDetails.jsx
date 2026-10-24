import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import MovementTable from '../components/inventory/MovementTable';
import StatusBadge from '../components/inventory/StatusBadge';
import StockBadge from '../components/inventory/StockBadge';

const emptyForm = {
  category_id: '',
  item_code: '',
  name: '',
  description: '',
  specs: '',
  price: '',
  stock_quantity: '',
  min_threshold: '',
  status: 'available',
};

function errorMessage(error, fallback) {
  const errors = error.response?.data?.errors;
  return errors ? Object.values(errors).flat().join(' ') : error.response?.data?.message || fallback;
}

export default function CustodianItemDetails({ user, onLogout }) {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [restockError, setRestockError] = useState('');
  const [restocking, setRestocking] = useState(false);

  const loadHistory = useCallback(async (page = 1) => {
    try {
      const response = await api.get(`/custodian/items/${itemId}/movements?page=${page}`);
      setHistory(response.data);
      setHistoryError('');
    } catch (requestError) {
      setHistoryError(errorMessage(requestError, 'Could not load this item’s movement history.'));
    }
  }, [itemId]);

  const loadItem = useCallback(async () => {
    try {
      const response = await api.get(`/items/${itemId}`);
      const loadedItem = response.data;
      setItem(loadedItem);
      setForm({
        category_id: String(loadedItem.category_id),
        item_code: loadedItem.item_code,
        name: loadedItem.name,
        description: loadedItem.description || '',
        specs: loadedItem.specs || '',
        price: String(loadedItem.price),
        stock_quantity: String(loadedItem.stock_quantity),
        min_threshold: String(loadedItem.min_threshold),
        status: loadedItem.status,
      });
      setError('');
    } catch (requestError) {
      setError(requestError.response?.status === 404
        ? 'This inventory item could not be found.'
        : 'Could not load item details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    const controller = new AbortController();

    api.get('/categories', { signal: controller.signal })
      .then((response) => setCategories(response.data))
      .catch((requestError) => {
        if (!axios.isCancel(requestError)) {
          setError(errorMessage(requestError, 'Could not load inventory categories.'));
        }
      });

    const initialItemLoad = window.setTimeout(loadItem, 0);
    const initialHistoryLoad = window.setTimeout(loadHistory, 0);

    return () => {
      controller.abort();
      window.clearTimeout(initialItemLoad);
      window.clearTimeout(initialHistoryLoad);
    };
  }, [loadHistory, loadItem]);

  const changeForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccess('');
    setSaving(true);
    try {
      const response = await api.put(`/custodian/items/${itemId}`, {
        ...form,
        category_id: Number(form.category_id),
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        min_threshold: Number(form.min_threshold),
      });
      setItem(response.data.data);
      setForm((current) => ({ ...current, stock_quantity: String(response.data.data.stock_quantity) }));
      setSuccess('Item details and stock level were updated.');
      await loadHistory();
    } catch (requestError) {
      setFormError(errorMessage(requestError, 'Could not update this inventory item.'));
    } finally {
      setSaving(false);
    }
  };

  const addStock = async (event) => {
    event.preventDefault();
    setRestockError('');
    setSuccess('');
    setRestocking(true);
    try {
      const response = await api.post(`/custodian/items/${itemId}/restock`, {
        quantity: Number(restockQuantity),
        notes: restockNotes,
      });
      setItem(response.data.data);
      setForm((current) => ({ ...current, stock_quantity: String(response.data.data.stock_quantity) }));
      setRestockQuantity('');
      setRestockNotes('');
      setSuccess(`Stock added. New quantity: ${response.data.data.stock_quantity}.`);
      await loadHistory();
    } catch (requestError) {
      setRestockError(errorMessage(requestError, 'Could not add stock to this item.'));
    } finally {
      setRestocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardHeader user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/custodian?section=items" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
          <span aria-hidden="true">←</span> Back to inventory
        </Link>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
        {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</p>}
        {loading ? (
          <div aria-label="Loading item details" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading item details…</div>
        ) : item && (
          <>
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex min-h-64 items-center justify-center bg-slate-100 p-6">
                  {item.photo_url ? <img src={item.photo_url} alt={item.name} className="max-h-80 w-full object-contain" /> : <span className="text-sm text-slate-400">No photo</span>}
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.status} /><span className="text-sm text-slate-500">{item.category?.name}</span></div>
                  <h1 className="text-2xl font-bold text-slate-950">{item.name}</h1>
                  <p className="font-mono text-sm text-slate-500">{item.item_code}</p>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current stock</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-slate-950">{item.stock_quantity}</p>
                    <div className="mt-2"><StockBadge item={item} /></div>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Unit price: {Number(item.price).toLocaleString(undefined, { style: 'currency', currency: 'PHP' })}</p>
                </div>
              </article>

              <div className="space-y-6">
                <form onSubmit={saveItem} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div><h2 className="text-lg font-bold text-slate-950">Edit item details</h2><p className="mt-1 text-sm text-slate-500">Changes to the stock quantity are recorded in the ledger.</p></div>
                  {formError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{formError}</p>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">Name<input required name="name" value={form.name} onChange={changeForm} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700">Item code<input required name="item_code" value={form.item_code} onChange={changeForm} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700">Category<select required name="category_id" value={form.category_id} onChange={changeForm} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                    <label className="text-sm font-medium text-slate-700">Unit price<input required type="number" min="0" step="0.01" name="price" value={form.price} onChange={changeForm} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700">Stock quantity<input required type="number" min="0" step="1" name="stock_quantity" value={form.stock_quantity} onChange={changeForm} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700">Low-stock threshold<input required type="number" min="0" step="1" name="min_threshold" value={form.min_threshold} onChange={changeForm} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">Status<select name="status" value={form.status} onChange={changeForm} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="discontinued">Discontinued</option></select></label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">Specifications<textarea name="specs" value={form.specs} onChange={changeForm} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">Description<textarea name="description" value={form.description} onChange={changeForm} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  </div>
                  <button type="submit" disabled={saving} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save item changes'}</button>
                </form>

                <form onSubmit={addStock} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div><h2 className="text-lg font-bold text-slate-950">Add new stock</h2><p className="mt-1 text-sm text-slate-500">Received stock is added to the current quantity and recorded in the ledger.</p></div>
                  {restockError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{restockError}</p>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">Quantity received<input required type="number" min="1" step="1" value={restockQuantity} onChange={(event) => setRestockQuantity(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700">Notes (optional)<input value={restockNotes} onChange={(event) => setRestockNotes(event.target.value)} maxLength={255} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  </div>
                  <button type="submit" disabled={restocking} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{restocking ? 'Adding stock…' : 'Add stock'}</button>
                </form>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5"><h2 className="text-lg font-bold text-slate-950">Item movement history</h2><p className="mt-1 text-sm text-slate-500">Every stock addition, adjustment, and release for this item.</p></div>
              {historyError && <p role="alert" className="m-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{historyError}</p>}
              {history ? <MovementTable movements={history.data} /> : !historyError && <p className="p-5 text-sm text-slate-500">Loading movement history…</p>}
              {history?.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
                  <button type="button" disabled={!history.prev_page_url} onClick={() => loadHistory(history.current_page - 1)} className="font-semibold text-blue-700 disabled:text-slate-400">Previous</button>
                  <span className="text-slate-500">Page {history.current_page} of {history.last_page}</span>
                  <button type="button" disabled={!history.next_page_url} onClick={() => loadHistory(history.current_page + 1)} className="font-semibold text-blue-700 disabled:text-slate-400">Next</button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
