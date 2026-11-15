import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/axios';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import RequestReceipt from '../../components/requests/RequestReceipt';
import { loadRequestCart, saveRequestCart } from '../../components/requests/requestCart';
import InventorySection from './components/InventorySection';
import RequestComposer from './components/RequestComposer';
import RequestsSection from './components/RequestsSection';

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
  const [summaryError, setSummaryError] = useState('');
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
          setSummaryError('Could not load inventory totals. Please try again.');
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
        .then((response) => {
          setItems(response.data);
          setItemsError('');
        })
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
    let summaryController;

    const refreshInventory = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      setReloadItems((count) => count + 1);
      summaryController?.abort();
      summaryController = new AbortController();

      api.get('/dashboard/summary', { signal: summaryController.signal })
        .then((response) => {
          setSummary(response.data);
          setSummaryError('');
        })
        .catch((error) => {
          if (!axios.isCancel(error)) {
            setSummaryError('Could not refresh inventory totals. Please try again.');
          }
        });
    };

    const timer = window.setInterval(refreshInventory, 10000);
    document.addEventListener('visibilitychange', refreshInventory);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshInventory);
      summaryController?.abort();
    };
  }, []);

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

        {(dashboardError || summaryError) && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {dashboardError || summaryError}
          </div>
        )}

        {activeView === 'inventory' ? (
          <InventorySection
            summary={summary}
            summaryLoading={summaryLoading}
            filters={filters}
            categories={categories}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
            isFiltered={isFiltered}
            items={items}
            itemsLoading={itemsLoading}
            itemsError={itemsError}
            onRetryItems={retryItems}
            onRequestItem={addToRequest}
          />
        ) : (
          <RequestsSection
            requests={requests}
            error={requestsError}
            notices={statusNotices}
            cancellingRequest={cancellingRequest}
            onCancel={cancelRequest}
            onViewReceipt={setReceipt}
          />
        )}

        <RequestComposer
          open={requestComposerOpen}
          loading={requestLoading}
          cart={requestCart}
          purpose={purpose}
          error={requestError}
          hasUnavailableQuantity={hasUnavailableQuantity}
          onClose={() => setRequestComposerOpen(false)}
          onSubmit={submitRequest}
          onRemoveItem={(itemId) => setRequestCart((current) => current.filter((entry) => entry.item.id !== itemId))}
          onUpdateQuantity={updateCartQuantity}
          onPurposeChange={setPurpose}
        />
        {receipt && <RequestReceipt request={receipt} onClose={() => setReceipt(null)} />}
      </main>
    </div>
  );
}
