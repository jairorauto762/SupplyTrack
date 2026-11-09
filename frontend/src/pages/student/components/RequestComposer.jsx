export default function RequestComposer({
  open,
  loading,
  cart,
  purpose,
  error,
  hasUnavailableQuantity,
  onClose,
  onSubmit,
  onRemoveItem,
  onUpdateQuantity,
  onPurposeChange,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
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
          <button type="button" aria-label="Close request" onClick={onClose} disabled={loading} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {cart.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Your request is empty. Add available items from the inventory.</p>
          ) : (
            <ul className="space-y-3">
              {cart.map(({ item, quantity }) => (
                <li key={item.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-semibold text-slate-900">{item.name}</p><p className="mt-0.5 text-xs text-slate-500">{item.stock_quantity} available</p></div>
                    <button type="button" onClick={() => onRemoveItem(item.id)} className="text-xs font-semibold text-rose-700 hover:underline">Remove</button>
                  </div>
                  <label className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                    Quantity
                    <input type="number" min="1" value={quantity} onChange={(event) => onUpdateQuantity(item.id, event.target.value)} className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-right" />
                  </label>
                  {quantity > item.stock_quantity && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">Not enough stock. Only {item.stock_quantity} available.</p>}
                </li>
              ))}
            </ul>
          )}

          <label className="block text-sm font-medium text-slate-700">
            Purpose
            <textarea required maxLength={500} value={purpose} onChange={(event) => onPurposeChange(event.target.value)} rows={3} placeholder="Explain how these supplies will be used" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15" />
          </label>
          <button type="submit" disabled={loading || !cart.length || hasUnavailableQuantity} className="w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      </section>
    </div>
  );
}
