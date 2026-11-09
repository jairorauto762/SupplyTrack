import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import InventorySummary from '../components/dashboard/InventorySummary';
import InventoryFilters from '../components/inventory/InventoryFilters';
import InventoryTable from '../components/inventory/InventoryTable';
import RequestReceipt from '../components/requests/RequestReceipt';
import RequestStatus from '../components/requests/RequestStatus';
import { loadRequestCart, saveRequestCart } from '../components/requests/requestCart';

const initialFilters = {
  search: '',
  category: '',
  stock: '',
  status: '',
};

export default function InventoryDashboard({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [itemsError, setItemsError] = useState('');
  const [dashboardError, setDashboardError] = useState('');
  const [reloadItems, setReloadItems] = useState(0);
  const [requestCart, setRequestCart] = useState(loadRequestCart);
  const [purpose, setPurpose] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestsError, setRequestsError] = useState('');
  const [statusNotices, setStatusNotices] = useState([]);
  const [activeView, setActiveView] = useState('inventory');
  const [requestComposerOpen, setRequestComposerOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const knownRequests = useRef(null);

  const loadRequests = useCallback(async () => {
    try {
      const response = await api.get('/requests');
      const current = response.data;

      if (knownRequests.current) {
        const notices = current
          .filter((request) => knownRequests.current.get(request.id) !== request.status)
          .filter((request) => ['approved', 'ready', 'declined', 'released', 'cancelled'].includes(request.status))
          .map((request) => `Request #${request.id} is now ${request.status}.`);

        if (notices.length) {
          setStatusNotices((existing) => [...notices, ...existing].slice(0, 4));
        }
      }

      knownRequests.current = new Map(current.map((request) => [request.id, request.status]));
      setRequests(current);
      setRequestsError('');
    } catch (error) {
      if (!axios.isCancel(error)) {
        setRequestsError('Could not load your supply requests. Please try again.');
      }
    }
  }, []);

  const isFiltered = useMemo(
    () => Object.values(filters).some(Boolean),
    [filters],
  );

  useEffect(() => {
    const controller = new AbortController();

    api.get('/categories', { signal: controller.signal })
      .then((response) => setCategories(response.data))
      .catch((error) => {
        if (!axios.isCancel(error)) {
          setDashboardError('Could not load inventory categories. Please refresh the page to try again.');
        }
      });

    api.get('/dashboard/summary', { signal: controller.signal })
      .then((response) => setSummary(response.data))
      .catch((error) => {
        if (!axios.isCancel(error)) {
          setDashboardError('Could not load inventory totals. Please refresh the page to try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSummaryLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      api.get('/items', {
        params: filters,
        signal: controller.signal,
      })
        .then((response) => setItems(response.data))
        .catch((error) => {
          if (!axios.isCancel(error)) {
            setItemsError('Could not load inventory items from the server.');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setItemsLoading(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, reloadItems]);

  useEffect(() => {
    loadRequests();
    const timer = window.setInterval(loadRequests, 15000);
    return () => window.clearInterval(timer);
  }, [loadRequests]);

  useEffect(() => {
    saveRequestCart(requestCart);
  }, [requestCart]);

  const updateFilter = (key, value) => {
    setItemsLoading(true);
    setItemsError('');
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  };

  const clearFilters = () => {
    setItemsLoading(true);
    setItemsError('');
    setFilters(initialFilters);
  };

  const retryItems = () => {
    setItemsLoading(true);
    setItemsError('');
    setReloadItems((count) => count + 1);
  };

  const addToRequest = (item) => {
    setRequestError('');
    setRequestCart((current) => {
      const existing = current.find((entry) => entry.item.id === item.id);
      return existing
        ? current.map((entry) => entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry)
        : [...current, { item, quantity: 1 }];
    });
    setRequestComposerOpen(true);
  };

  const hasUnavailableQuantity = requestCart.some(({ item, quantity }) => quantity > item.stock_quantity);

  const updateCartQuantity = (itemId, quantity) => {
    const parsedQuantity = Number.parseInt(quantity, 10);
    setRequestCart((current) => current.map((entry) => (
      entry.item.id === itemId
        ? { ...entry, quantity: Number.isNaN(parsedQuantity) ? 1 : parsedQuantity }
        : entry
    )));
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    setRequestError('');
    setRequestLoading(true);

    try {
      await api.post('/requests', {
        purpose: purpose.trim(),
        items: requestCart.map(({ item, quantity }) => ({ item_id: item.id, quantity })),
      });
      setPurpose('');
      setRequestCart([]);
      setStatusNotices(['Your supply request was submitted.']);
      knownRequests.current = null;
      setRequestComposerOpen(false);
      setActiveView('requests');
      await loadRequests();
    } catch (error) {
      setRequestError(error.response?.data?.message || 'Could not submit the request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const cancelRequest = async (request) => {
    if (!window.confirm(`Cancel pending request #${request.id}?`)) {
      return;
    }

    setCancellingRequest(request.id);
    setRequestsError('');

    try {
      await api.post(`/requests/${request.id}/cancel`);
      await loadRequests();
    } catch (error) {
      setRequestsError(error.response?.data?.message || 'Could not cancel this request. Please try again.');
    } finally {
      setCancellingRequest(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardHeader user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">Supply overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Inventory dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor supply levels and quickly find the items you need.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {requestCart.length > 0 && (
              <button
                type="button"
                onClick={() => setRequestComposerOpen(true)}
                className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
              >
                Review request ({requestCart.length})
              </button>
            )}
            <p className="text-sm text-slate-500">
              {itemsLoading ? 'Updating inventory…' : `${items.length.toLocaleString()} ${items.length === 1 ? 'item' : 'items'} shown`}
            </p>
          </div>
        </section>

        <nav aria-label="Student workspace sections" className="flex gap-2 border-b border-slate-200">
          <button
            type="button"
            aria-current={activeView === 'inventory' ? 'page' : undefined}
            onClick={() => setActiveView('inventory')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeView === 'inventory' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Browse inventory
          </button>
          <button
            type="button"
            aria-current={activeView === 'requests' ? 'page' : undefined}
            onClick={() => setActiveView('requests')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeView === 'requests' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            My requests
            {requests.length > 0 && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-800">{requests.length}</span>}
          </button>
        </nav>

        {dashboardError && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {dashboardError}
          </div>
        )}

        {activeView === 'inventory' ? (
          <section aria-label="Browse inventory" className="space-y-5">
            <InventorySummary summary={summary} loading={summaryLoading} />
            <InventoryFilters
              filters={filters}
              categories={categories}
              onChange={updateFilter}
              onClear={clearFilters}
              isFiltered={isFiltered}
            />
            <InventoryTable
              items={items}
              loading={itemsLoading}
              filtered={isFiltered}
              error={itemsError}
              onRetry={retryItems}
              onRequest={addToRequest}
            />
          </section>
        ) : (
          <section aria-label="My supply requests" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Request tracking</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">My requests</h2>
              <p className="mt-1 text-sm text-slate-500">Status updates refresh automatically while this page is open.</p>
            </div>
            {statusNotices.length > 0 && (
              <div aria-live="polite" className="space-y-2">
                {statusNotices.map((notice, index) => <p key={`${notice}-${index}`} className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">{notice}</p>)}
              </div>
            )}
            {requestsError && <p role="alert" className="text-sm text-rose-700">{requestsError}</p>}
            {requests.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">You have not submitted any requests yet.</p>
            ) : (
              <ul className="space-y-4">
                {requests.map((request) => (
                  <li key={request.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><h3 className="font-semibold text-slate-900">Request #{request.id}</h3><p className="mt-1 text-xs text-slate-500">{new Date(request.created_at).toLocaleString()}</p></div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{request.status}</span>
                    </div>
                    <p className="text-sm text-slate-600">{request.purpose}</p>
                    <ul className="list-inside list-disc text-sm text-slate-600">
                      {request.request_items.map((entry) => <li key={entry.id}>{entry.item.name} × {entry.quantity}</li>)}
                    </ul>
                    <RequestStatus status={request.status} />
                    {request.declined_reason && <p className="text-sm text-rose-700">Reason: {request.declined_reason}</p>}
                    {request.status === 'pending' && (
                      <button
                        type="button"
                        disabled={cancellingRequest === request.id}
                        onClick={() => cancelRequest(request)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cancellingRequest === request.id ? 'Cancelling…' : 'Cancel pending request'}
                      </button>
                    )}
                    {request.status === 'released' && (
                      <button type="button" onClick={() => setReceipt(request)} className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">View printable receipt</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {requestComposerOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !requestLoading) {
                setRequestComposerOpen(false);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="request-composer-title"
              className="max-h-[calc(100vh-1.5rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Request details</p>
                  <h2 id="request-composer-title" className="mt-1 text-lg font-bold text-slate-950">Submit a supply request</h2>
                  <p className="mt-1 text-sm text-slate-500">Review your items and tell us what they are needed for.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close request"
                  onClick={() => setRequestComposerOpen(false)}
                  disabled={requestLoading}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>
              </div>

              <form onSubmit={submitRequest} className="space-y-4">
                {requestError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{requestError}</p>}
                {requestCart.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Your request is empty. Add available items from the inventory.</p>
                ) : (
                  <ul className="space-y-3">
                    {requestCart.map(({ item, quantity }) => (
                      <li key={item.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="text-sm font-semibold text-slate-900">{item.name}</p><p className="mt-0.5 text-xs text-slate-500">{item.stock_quantity} available</p></div>
                          <button type="button" onClick={() => setRequestCart((current) => current.filter((entry) => entry.item.id !== item.id))} className="text-xs font-semibold text-rose-700 hover:underline">Remove</button>
                        </div>
                        <label className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                          Quantity
                          <input type="number" min="1" value={quantity} onChange={(event) => updateCartQuantity(item.id, event.target.value)} className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-right" />
                        </label>
                        {quantity > item.stock_quantity && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">Not enough stock. Only {item.stock_quantity} available.</p>}
                      </li>
                    ))}
                  </ul>
                )}

                <label className="block text-sm font-medium text-slate-700">
                  Purpose
                  <textarea required maxLength={500} value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={3} placeholder="Explain how these supplies will be used" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15" />
                </label>
                <button type="submit" disabled={requestLoading || !requestCart.length || hasUnavailableQuantity} className="w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {requestLoading ? 'Submitting…' : 'Submit request'}
                </button>
              </form>
            </section>
          </div>
        )}
        {receipt && <RequestReceipt request={receipt} onClose={() => setReceipt(null)} />}
      </main>
    </div>
  );
}
