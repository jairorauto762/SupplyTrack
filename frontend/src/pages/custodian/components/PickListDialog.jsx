import ReportExportMenu from '../../../components/requests/ReportExportMenu';

export default function PickListDialog({ requests, onClose }) {
  if (!requests) {
    return null;
  }

  const preparedAt = new Date().toLocaleString();
  const report = {
    title: 'Approved requests pick list',
    fileName: 'supplytrack-approved-requests-pick-list',
    details: [{ label: 'Prepared', value: preparedAt }],
    columns: ['Request', 'Student', 'Item', 'Quantity', 'Status'],
    rows: requests.flatMap((request) => (
      (request.request_items || request.requestItems || []).map((entry) => [
        `#${request.id}`,
        request.user?.name || '',
        entry.item?.name || '',
        entry.quantity,
        request.status,
      ])
    )),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="pick-list-title" className="print-target max-h-[calc(100vh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wide text-brand-700">SPC SupplyTrack</p><h2 id="pick-list-title" className="mt-1 text-xl font-bold text-slate-950">Approved requests pick list</h2><p className="mt-1 text-sm text-slate-500">Prepared {preparedAt}</p></div>
          <div className="print-hidden flex gap-2"><ReportExportMenu report={report} /><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Close</button></div>
        </div>
        {requests.length === 0 ? <p className="mt-5 text-sm text-slate-500">There are no approved requests to pick.</p> : (
          <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="py-3">Request</th><th className="py-3">Student</th><th className="py-3">Item</th><th className="py-3 text-right">Qty</th><th className="py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{requests.flatMap((request) => (request.request_items || request.requestItems || []).map((entry) => <tr key={`${request.id}-${entry.id}`}><td className="py-3">#{request.id}</td><td className="py-3">{request.user?.name}</td><td className="py-3">{entry.item?.name}</td><td className="py-3 text-right font-semibold">{entry.quantity}</td><td className="py-3 capitalize">{request.status}</td></tr>))}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
