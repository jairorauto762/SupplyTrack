import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, Filter, ArrowUpDown, PackageOpen } from 'lucide-react';

export default function InventoryTable({ items, onSelectRequest }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Filter & Sort Logic
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.item_code.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          categoryFilter === 'all' || item.category_id.toString() === categoryFilter;

        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'low' && item.stock_quantity <= item.min_threshold) ||
          (stockFilter === 'instock' && item.stock_quantity > 0);

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'lowest_stock') return a.stock_quantity - b.stock_quantity;
        if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        return a.name.localeCompare(b.name);
      });
  }, [items, searchTerm, categoryFilter, stockFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or code..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="p-2 border rounded-lg text-sm bg-white"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="1">Office Supplies</option>
          <option value="2">Electronics & IT</option>
          <option value="3">Lab Equipment</option>
        </select>

        <select
          className="p-2 border rounded-lg text-sm bg-white"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">All Stock Statuses</option>
          <option value="low">Low Stock Warning</option>
          <option value="instock">In Stock Only</option>
        </select>

        <select
          className="p-2 border rounded-lg text-sm bg-white"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort by Name</option>
          <option value="lowest_stock">Sort by Lowest Stock</option>
          <option value="newest">Sort by Newest</option>
        </select>
      </div>

      {/* Feature 31: Friendly Empty State */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border border-dashed rounded-xl text-center">
          <PackageOpen className="w-12 h-12 text-gray-400 mb-2" />
          <h3 className="font-semibold text-gray-700">No items found</h3>
          <p className="text-sm text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        /* Inventory Table */
        <div className="overflow-x-auto border rounded-xl shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const isLowStock = item.stock_quantity <= item.min_threshold;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{item.item_code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{item.stock_quantity} units</span>
                        {/* Feature 7: Low stock flag */}
                        {isLowStock && (
                          <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                            <AlertTriangle className="w-3 h-3" /> Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                          item.status === 'available'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectRequest(item)}
                        disabled={item.stock_quantity === 0 || item.status !== 'available'}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed"
                      >
                        Request
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}