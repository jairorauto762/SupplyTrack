import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import RequestReceipt from '../components/requests/RequestReceipt';

const emptyItem = {
  category_id: '',
  item_code: '',
  name: '',
  description: '',
  specs: '',
  price: '0',
  stock_quantity: '0',
  min_threshold: '5',
  status: 'available',
};

function RequestCard({ request, action, busy }) {
  const items = request.request_items || request.requestItems || [];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Request #{request.id}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{request.user?.name || 'Student'}</h3>
          <p className="text-sm text-slate-500">{request.user?.email}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-800">{request.status}</span>
      </div>
      <p className="mt-4 text-sm text-slate-700">{request.purpose}</p>
      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Requested items</p>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
          {items.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-4">
              <span>{entry.item?.name || 'Item'} <span className="text-slate-500">({entry.item?.item_code})</span></span>
              <span className="shrink-0 font-semibold">× {entry.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {request.status === 'pending' && (
          <>
            <button type="button" disabled={busy} onClick={() => action(request, 'approve')} className="rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? 'Saving…' : 'Approve'}</button>
            <button type="button" disabled={busy} onClick={() => action(request, 'decline')} className="rounded-lg border border-rose-200 px-3.5 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50">Decline</button>
          </>
        )}
        {request.status === 'approved' && (
          <button type="button" disabled={busy} onClick={() => action(request, 'ready')} className="rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">Mark ready for pickup</button>
        )}
        {request.status === 'ready' && (
          <button type="button" disabled={busy} onClick={() => action(request, 'release')} className="rounded-lg bg-violet-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">{busy ? 'Releasing…' : 'Release items at counter'}</button>
        )}
      </div>
    </article>
  );
}

export default function CustodianDashboard({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [pageError, setPageError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');
  const [itemError, setItemError] = useState('');
  const [itemSuccess, setItemSuccess] = useState('');
  const [itemLoading, setItemLoading] = useState(false);
  const [busyRequest, setBusyRequest] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [receipt, setReceipt] = useState(null);
  const [pickList, setPickList] = useState(null);
  const [pickListError, setPickListError] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      const response = await api.get('/custodian/requests');
      setRequests(response.data);
      setPageError('');
    } catch (error) {
      setPageError(error.response?.data?.message || 'Could not load supply requests. Please refresh to try again.');
    }
  }, []);

  useEffect(() => {
    api.get('/categories')
      .then((response) => setCategories(response.data))
      .catch((error) => setCategoriesError(error.response?.data?.message || 'Could not load inventory categories.'));

    const initialLoad = window.setTimeout(loadRequests, 0);
    const timer = window.setInterval(loadRequests, 15000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadRequests]);

  const runRequestAction = async (request, action) => {
    setBusyRequest(request.id);
    setPageError('');
    try {
      const response = await api.post(`/custodian/requests/${request.id}/${action}`);
      await loadRequests();
      if (action === 'release') {
        setReceipt(response.data.data);
      }
    } catch (error) {
      setPageError(error.response?.data?.message || `Could not ${action} request #${request.id}.`);
    } finally {
      setBusyRequest(null);
    }
  };

  const declineRequest = (request) => {
    if (window.confirm(`Decline request #${request.id}?`)) {
      runRequestAction(request, 'decline');
    }
  };

  const handleRequestAction = (request, action) => (
    action === 'decline' ? declineRequest(request) : runRequestAction(request, action)
  );

  const changeItem = (event) => {
    const { name, value } = event.target;
    setItemForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'stock_quantity' && value === '0' && current.status === 'available' ? { status: 'unavailable' } : {}),
      ...(name === 'stock_quantity' && current.stock_quantity === '0' && value !== '0' && current.status === 'unavailable' ? { status: 'available' } : {}),
    }));
  };

  const addItem = async (event) => {
    event.preventDefault();
    setItemError('');
    setItemSuccess('');
    setItemLoading(true);

    try {
      const response = await api.post('/custodian/items', {
        ...itemForm,
        price: Number(itemForm.price),
        stock_quantity: Number(itemForm.stock_quantity),
        min_threshold: Number(itemForm.min_threshold),
      });
      setItemSuccess(`${response.data.data.name} was added to inventory.`);
      setItemForm({ ...emptyItem, category_id: categories[0]?.id ? String(categories[0].id) : '' });
    } catch (error) {
      const errors = error.response?.data?.errors;
      setItemError(errors ? Object.values(errors).flat().join(' ') : error.response?.data?.message || 'Could not add this inventory item.');
    } finally {
      setItemLoading(false);
    }
  };

  const showPickList = async () => {
    setPickListError('');
    try {
      const response = await api.get('/custodian/pick-list');
      setPickList(response.data);
    } catch (error) {
      setPickListError(error.response?.data?.message || 'Could not prepare the approved-request pick list.');
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="print-hidden"><DashboardHeader user={user} onLogout={onLogout} /></div>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Custodian workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Supply desk</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review requests, prepare pickups, and manage the campus inventory.</p>
          </div>
          <div className="flex flex-wrap gap-2 print-hidden">
            <button type="button" onClick={showPickList} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Prepare pick list</button>
            <button type="button" onClick={() => setActiveTab('inventory')} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Add inventory item</button>
          </div>
        </section>

        {pageError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{pageError}</p>}
        {categoriesError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{categoriesError}</p>}
        {pickListError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{pickListError}</p>}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Pending requests</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Approved / preparing</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{requests.filter((request) => ['approved', 'ready'].includes(request.status)).length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Queue refreshed</p>
            <p className="mt-2 text-base font-bold text-slate-950">{new Date().toLocaleTimeString()}</p>
            <p className="mt-1 text-xs text-slate-500">Updates automatically every 15 seconds</p>
          </div>
        </section>

        <nav aria-label="Custodian workspace sections" className="print-hidden flex gap-2 border-b border-slate-200">
          <button type="button" onClick={() => setActiveTab('requests')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'requests' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-500'}`}>
            Requests {pendingCount > 0 && <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800">{pendingCount}</span>}
          </button>
          <button type="button" onClick={() => setActiveTab('inventory')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'inventory' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-500'}`}>Add inventory</button>
        </nav>

        {activeTab === 'requests' ? (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div><h2 className="text-lg font-bold text-slate-950">Request queue</h2><p className="mt-1 text-sm text-slate-500">Approve or decline requests, then mark approved supplies ready for pickup.</p></div>
              <button type="button" onClick={loadRequests} className="print-hidden rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
            </div>
            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">There are no active requests.</div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {requests.map((request) => (
                  <RequestCard key={request.id} request={request} action={handleRequestAction} busy={busyRequest === request.id} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <form onSubmit={addItem} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Inventory management</p><h2 className="mt-1 text-xl font-bold text-slate-950">Add a new item</h2><p className="mt-1 text-sm text-slate-500">New stock will be recorded in the inventory ledger.</p></div>
            {itemError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{itemError}</p>}
            {itemSuccess && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{itemSuccess}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Item name<input required name="name" value={itemForm.name} onChange={changeItem} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
              <label className="text-sm font-medium text-slate-700">Item code<input required name="item_code" value={itemForm.item_code} onChange={changeItem} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
              <label className="text-sm font-medium text-slate-700">Category<select required name="category_id" value={itemForm.category_id} onChange={changeItem} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5"><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-700">Unit price<input required type="number" min="0" step="0.01" name="price" value={itemForm.price} onChange={changeItem} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
              <label className="text-sm font-medium text-slate-700">Starting stock<input required type="number" min="0" step="1" name="stock_quantity" value={itemForm.stock_quantity} onChange={changeItem} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
              <label className="text-sm font-medium text-slate-700">Low-stock threshold<input required type="number" min="0" step="1" name="min_threshold" value={itemForm.min_threshold} onChange={changeItem} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Specifications<input name="specs" value={itemForm.specs} onChange={changeItem} placeholder="Size, color, packaging, or other details" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Description<textarea name="description" value={itemForm.description} onChange={changeItem} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
              <label className="text-sm font-medium text-slate-700">Item status<select name="status" value={itemForm.status} onChange={changeItem} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5"><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="discontinued">Discontinued</option></select></label>
            </div>
            <button type="submit" disabled={itemLoading || categories.length === 0} className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{itemLoading ? 'Adding item…' : 'Add item to inventory'}</button>
          </form>
        )}

        {pickList && (
          <section className="print-target rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">SPC SupplyTrack</p><h2 className="mt-1 text-xl font-bold text-slate-950">Approved requests pick list</h2><p className="mt-1 text-sm text-slate-500">Prepared {new Date().toLocaleString()}</p></div>
              <div className="print-hidden flex gap-2"><button type="button" onClick={() => window.print()} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Print pick list</button><button type="button" onClick={() => setPickList(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Close</button></div>
            </div>
            {pickList.length === 0 ? <p className="mt-5 text-sm text-slate-500">There are no approved requests to pick.</p> : (
              <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="py-3">Request</th><th className="py-3">Student</th><th className="py-3">Item</th><th className="py-3 text-right">Qty</th><th className="py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{pickList.flatMap((request) => (request.request_items || request.requestItems || []).map((entry) => <tr key={`${request.id}-${entry.id}`}><td className="py-3">#{request.id}</td><td className="py-3">{request.user?.name}</td><td className="py-3">{entry.item?.name}</td><td className="py-3 text-right font-semibold">{entry.quantity}</td><td className="py-3 capitalize">{request.status}</td></tr>))}</tbody></table></div>
            )}
          </section>
        )}

        {receipt && <RequestReceipt request={receipt} onClose={() => setReceipt(null)} />}
      </main>
    </div>
  );
}
