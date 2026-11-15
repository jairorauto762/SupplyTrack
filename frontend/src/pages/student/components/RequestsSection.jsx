import RequestStatus from '../../../components/requests/RequestStatus';

export default function RequestsSection({
  requests,
  error,
  notices,
  cancellingRequest,
  onCancel,
  onViewReceipt,
}) {
  return (
    <section aria-label="My supply requests" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Request tracking</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950">My requests</h2>
        <p className="mt-1 text-sm text-slate-500">Status updates refresh automatically while this page is open.</p>
      </div>
      {notices.length > 0 && (
        <div aria-live="polite" className="space-y-2">
          {notices.map((notice, index) => <p key={`${notice}-${index}`} className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">{notice}</p>)}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {requests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">You have not submitted any requests yet.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li key={request.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h3 className="font-semibold text-slate-900">Request #{request.id}</h3><p className="mt-1 text-xs text-slate-500">{new Date(request.created_at).toLocaleString()}</p></div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{request.status}</span>
              </div>
              <p className="text-sm text-slate-600">{request.purpose}</p>
              <ul className="list-inside list-disc text-sm text-slate-600">
                {request.request_items.map((entry) => <li key={entry.id}>{entry.item.name} × {entry.quantity}</li>)}
              </ul>
              <RequestStatus status={request.status} />
              {request.declined_reason && <p className="text-sm text-rose-700">Reason: {request.declined_reason}</p>}
              {request.status === 'pending' && (
                <button
                  type="button"
                  disabled={cancellingRequest === request.id}
                  onClick={() => onCancel(request)}
                  className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancellingRequest === request.id ? 'Cancelling…' : 'Cancel pending request'}
                </button>
              )}
              {request.status === 'released' && (
                <button type="button" onClick={() => onViewReceipt(request)} className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">View printable receipt</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
