import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import InventorySummary from '../components/dashboard/InventorySummary';
import InventoryFilters from '../components/inventory/InventoryFilters';
import InventoryTable from '../components/inventory/InventoryTable';

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardHeader user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Supply overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Inventory dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor supply levels and quickly find the items you need.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {itemsLoading ? 'Updating inventory…' : `${items.length.toLocaleString()} ${items.length === 1 ? 'item' : 'items'} shown`}
          </p>
        </section>

        {dashboardError && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {dashboardError}
          </div>
        )}

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
        />
      </main>
    </div>
  );
}
