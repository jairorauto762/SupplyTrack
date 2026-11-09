import MovementTable from '../../../components/inventory/MovementTable';

export default function LedgerPanel({ ledger, error, loading, onRefresh, onPageChange }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div><h2 className="text-lg font-bold text-slate-950">Stock ledger</h2><p className="mt-1 text-sm text-slate-500">A record of every stock addition, adjustment, and item release.</p></div>
        <button type="button" onClick={onRefresh} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh ledger</button>
      </div>
      {error && <p role="alert" className="m-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {loading && !ledger ? <p className="p-5 text-sm text-slate-500">Loading stock ledger…</p> : ledger && <MovementTable movements={ledger.data} showItem />}
      {ledger && ledger.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
          <button type="button" disabled={!ledger.prev_page_url || loading} onClick={() => onPageChange(ledger.current_page - 1)} className="font-semibold text-brand-700 disabled:text-slate-400">Previous</button>
          <span className="text-slate-500">Page {ledger.current_page} of {ledger.last_page}</span>
          <button type="button" disabled={!ledger.next_page_url || loading} onClick={() => onPageChange(ledger.current_page + 1)} className="font-semibold text-brand-700 disabled:text-slate-400">Next</button>
        </div>
      )}
    </section>
  );
}
