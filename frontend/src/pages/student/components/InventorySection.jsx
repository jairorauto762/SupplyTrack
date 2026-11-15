import InventorySummary from '../../../components/dashboard/InventorySummary';
import InventoryFilters from '../../../components/inventory/InventoryFilters';
import InventoryTable from '../../../components/inventory/InventoryTable';

export default function InventorySection({
  summary,
  summaryLoading,
  filters,
  categories,
  onFilterChange,
  onClearFilters,
  isFiltered,
  items,
  itemsLoading,
  itemsError,
  onRetryItems,
  onRequestItem,
}) {
  return (
    <section aria-label="Browse inventory" className="space-y-5">
      <InventorySummary summary={summary} loading={summaryLoading} />
      <InventoryFilters
        filters={filters}
        categories={categories}
        onChange={onFilterChange}
        onClear={onClearFilters}
        isFiltered={isFiltered}
      />
      <InventoryTable
        items={items}
        loading={itemsLoading}
        filtered={isFiltered}
        error={itemsError}
        onRetry={onRetryItems}
        onRequest={onRequestItem}
      />
    </section>
  );
}
