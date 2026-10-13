const selectStyle =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15';

export default function InventoryFilters({ filters, categories, onChange, onClear, isFiltered }) {
  return (
    <section aria-label="Inventory filters" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Inventory items</h2>
            <p className="mt-0.5 text-sm text-slate-500">Search and filter supplies by category, stock, or status.</p>
          </div>
          {isFiltered && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h5M20 20v-5h-5M5.5 9A7 7 0 0 1 18 6l1.5 2M18.5 15A7 7 0 0 1 6 18l-1.5-2" />
              </svg>
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.6fr)_repeat(3,minmax(150px,1fr))]">
          <label className="relative block sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Search inventory</span>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
            </svg>
            <input
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              type="search"
              placeholder="Search name, code, or category"
              value={filters.search}
              onChange={(event) => onChange('search', event.target.value)}
            />
          </label>

          <label>
            <span className="sr-only">Filter by category</span>
            <select className={selectStyle} value={filters.category} onChange={(event) => onChange('category', event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by stock level</span>
            <select className={selectStyle} value={filters.stock} onChange={(event) => onChange('stock', event.target.value)}>
              <option value="">All stock levels</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by item status</span>
            <select className={selectStyle} value={filters.status} onChange={(event) => onChange('status', event.target.value)}>
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
