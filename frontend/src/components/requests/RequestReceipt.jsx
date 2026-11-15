<<<<<<< HEAD
import printPage from '../../utils/printPage';
=======
import ReportExportMenu from './ReportExportMenu';
>>>>>>> 0dc4acc55008b49ae48e9c82bb0f77911a3fe132

export default function RequestReceipt({ request, onClose }) {
  if (!request) {
    return null;
  }

  const items = request.request_items || request.requestItems || [];
  const releasedAt = request.released_at ? new Date(request.released_at).toLocaleString() : 'today';
  const report = {
    title: `Release receipt - Request #${request.id}`,
    fileName: `supplytrack-receipt-${request.id}`,
    details: [
      { label: 'Released', value: releasedAt },
      { label: 'Requested by', value: request.user?.name || 'Student' },
      { label: 'Purpose', value: request.purpose || 'Not specified' },
    ],
    columns: ['Item', 'Quantity released'],
    rows: items.map((entry) => [entry.item?.name || 'Item', entry.quantity]),
  };

  return (
<<<<<<< HEAD
    <section className="print-target print-receipt-target rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
=======
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="receipt-title" className="print-target max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-7">
>>>>>>> 0dc4acc55008b49ae48e9c82bb0f77911a3fe132
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-700">SPC SupplyTrack</p>
          <h2 id="receipt-title" className="mt-2 text-xl font-bold text-slate-950">Release receipt · Request #{request.id}</h2>
          <p className="mt-1 text-sm text-slate-500">Released {releasedAt}</p>
        </div>
        <div className="print-hidden flex gap-2">
<<<<<<< HEAD
          <button type="button" onClick={() => printPage('receipt')} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Print receipt
          </button>
=======
          <ReportExportMenu report={report} />
>>>>>>> 0dc4acc55008b49ae48e9c82bb0f77911a3fe132
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
    </div>
  );
}
