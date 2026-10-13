import { useEffect, useState } from 'react';
import api from './api/axios';

const selectStyle =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20';

function StockBadge({ item }) {
  if (item.stock_quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
        Out of stock
      </span>
    );
  }
  if (item.is_low_stock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
        Low stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
      In stock
    </span>
  );
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  if (s === 'available') {
    return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Available</span>;
  }
  if (s === 'unavailable') {
    return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Unavailable</span>;
  }
  if (s === 'discontinued') {
    return <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">Discontinued</span>;
  }
  return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">{status}</span>;
}

export default function InventoryTable() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name');

  // Check if any filter is active
  const isFiltered = search || category || stock || status || sort !== 'name';

  // Load the category dropdown once
  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  // Reload items when any filter changes (search waits 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      api
        .get('/items', { params: { search, category, stock, status, sort } })
        .then((res) => setItems(res.data))
        .catch(() => setError('Could not load items from the server.'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, stock, status, sort]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStock('');
    setStatus('');
    setSort('name');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Items</h2>
          {!loading && (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Browse, filter, and track campus supply quantities in real time.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {/* Top Row: Search & Clear Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              placeholder="Search by item name, code, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset filters</span>
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <select className={selectStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select className={selectStyle} value={stock} onChange={(e) => setStock(e.target.value)}>
            <option value="">All stock levels</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>

          <select className={selectStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="discontinued">Discontinued</option>
          </select>

          <select className={selectStyle} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="stock_asc">Sort: Lowest stock</option>
            <option value="newest">Sort: Recently added</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3.5">Code</th>
                <th scope="col" className="px-5 py-3.5">Item Name</th>
                <th scope="col" className="px-5 py-3.5">Category</th>
                <th scope="col" className="px-5 py-3.5">Quantity</th>
                <th scope="col" className="px-5 py-3.5">Stock Status</th>
                <th scope="col" className="px-5 py-3.5">Item Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Skeleton Loader */}
              {loading &&
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-16 rounded bg-slate-200" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-36 rounded bg-slate-200" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 rounded bg-slate-200" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-12 rounded bg-slate-200" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-20 rounded-full bg-slate-200" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 rounded bg-slate-200" /></td>
                  </tr>
                ))}

              {/* Empty State */}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">No items found</p>
                    <p className="mt-1 text-sm text-slate-500">
                      We couldn't find anything matching your current filters.
                    </p>
                    {isFiltered && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!loading &&
                items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-500">
                      <span className="rounded bg-slate-100 px-2 py-1 border border-slate-200">
                        {item.item_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {item.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {item.stock_quantity}
                    </td>
                    <td className="px-5 py-3.5">
                      <StockBadge item={item} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}