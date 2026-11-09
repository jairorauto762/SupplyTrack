function RequestCard({ request, action, busy }) {
  const items = request.request_items || request.requestItems || [];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Request #{request.id}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{request.user?.name || 'Student'}</h3>
          <p className="text-sm text-slate-500">{request.user?.email}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold capitalize text-brand-800">{request.status}</span>
      </div>
      <p className="mt-4 text-sm text-slate-700">{request.purpose}</p>
      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Requested items</p>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
          {items.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-4">
              <span>{entry.item?.name || 'Item'} <span className="text-slate-500">({entry.item?.item_code})</span></span>
              <span className="shrink-0 font-semibold">× {entry.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {request.status === 'pending' && (
          <>
            <button type="button" disabled={busy} onClick={() => action(request, 'approve')} className="rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{busy ? 'Saving…' : 'Approve'}</button>
            <button type="button" disabled={busy} onClick={() => action(request, 'decline')} className="rounded-lg border border-rose-200 px-3.5 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50">Decline</button>
          </>
        )}
        {request.status === 'approved' && (
          <button type="button" disabled={busy} onClick={() => action(request, 'ready')} className="rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Mark ready for pickup</button>
        )}
        {request.status === 'ready' && (
          <button type="button" disabled={busy} onClick={() => action(request, 'release')} className="rounded-lg bg-violet-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">{busy ? 'Releasing…' : 'Release items at counter'}</button>
        )}
      </div>
    </article>
  );
}

export default function RequestsPanel({ requests, busyRequest, onAction, onRefresh }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-950">Request queue</h2><p className="mt-1 text-sm text-slate-500">Approve or decline requests, then mark approved supplies ready for pickup.</p></div>
        <button type="button" onClick={onRefresh} className="print-hidden rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
      </div>
      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">There are no active requests.</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} action={onAction} busy={busyRequest === request.id} />
          ))}
        </div>
      )}
    </section>
  );
}
