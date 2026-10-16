export default function RequestReceipt({ request, onClose }) {
  if (!request) {
    return null;
  }

  const items = request.request_items || request.requestItems || [];

  return (
    <section className="print-target rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">SPC SupplyTrack</p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">Release receipt · Request #{request.id}</h2>
          <p className="mt-1 text-sm text-slate-500">Released {request.released_at ? new Date(request.released_at).toLocaleString() : 'today'}</p>
        </div>
        <div className="print-hidden flex gap-2">
          <button type="button" onClick={() => window.print()} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Print receipt
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Close
            </button>
          )}
        </div>
      </div>
      <dl className="mt-5 grid gap-3 border-y border-slate-100 py-4 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">Requested by</dt><dd className="mt-1 font-semibold">{request.user?.name || 'Student'}</dd></div>
        <div><dt className="text-slate-500">Purpose</dt><dd className="mt-1 font-semibold">{request.purpose}</dd></div>
      </dl>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="py-2">Item</th><th className="py-2 text-right">Quantity released</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((entry) => (
              <tr key={entry.id}><td className="py-3 font-medium">{entry.item?.name || 'Item'}</td><td className="py-3 text-right">{entry.quantity}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-xs text-slate-500">Thank you. Please keep this receipt for your records.</p>
    </section>
  );
}
