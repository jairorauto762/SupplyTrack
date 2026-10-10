import { useEffect, useState } from 'react';
import api from './api/axios';

const control =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20';

function StockBadge({ item }) {
  if (item.stock_quantity === 0) {
    return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Out of stock</span>;
  }
  if (item.is_low_stock) {
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Low stock</span>;
  }
  return <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">In stock</span>;
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

  // Load the category dropdown once
  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  // Reload items when any filter changes (search waits 300ms after typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      api
        .get('/items', { params: { search, category, stock, status, sort } })
        .then((res) => setItems(res.data))
        .catch(() => setError('Could not load items.'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, stock, status, sort]);

  const clearFilters = () => {
    setSearch(''); setCategory(''); setStock(''); setStatus(''); setSort('name');
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h2 className="mb-4 text-2xl font-bold text-slate-900">Inventory</h2>

      {/* Search, filter, sort */}
      <div className="mb-4 grid gap-3 rounded-xl bg-white p-4 shadow sm:grid-cols-2 lg:grid-cols-5">
        <input className={`${control} sm:col-span-2 lg:col-span-5`}
          placeholder="Search by name, code, or category..."
          value={search} onChange={(e) => setSearch(e.target.value)} />

        <select className={control} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select className={control} value={stock} onChange={(e) => setStock(e.target.value)}>
          <option value="">All stock levels</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>

        <select className={control} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
          <option value="discontinued">Discontinued</option>
        </select>

        <select className={control} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="stock_asc">Sort: Lowest stock</option>
          <option value="newest">Sort: Newest</option>
        </select>

        <button onClick={clearFilters}
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Clear filters
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">No items match your search.</td></tr>
            )}
            {!loading && items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-600">{item.item_code}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                <td className="px-4 py-3">{item.category?.name}</td>
                <td className="px-4 py-3">{item.stock_quantity}</td>
                <td className="px-4 py-3"><StockBadge item={item} /></td>
                <td className="px-4 py-3 capitalize">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}