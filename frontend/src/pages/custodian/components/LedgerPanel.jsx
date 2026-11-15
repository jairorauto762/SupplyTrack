import { useCallback, useEffect, useState } from 'react';
import api from '../../../api/axios';
import MovementTable from '../../../components/inventory/MovementTable';
import ReportExportMenu from '../../../components/requests/ReportExportMenu';

const emptyFilters = {
  date_from: '',
  date_to: '',
  item_id: '',
  user_id: '',
};

function movementRows(movements) {
  return movements.map((movement) => [
    new Date(movement.created_at).toLocaleString(),
    movement.item?.name || 'Unknown item',
    movement.type === 'release' ? 'Released / taken' : movement.type.replace('_', ' '),
    movement.quantity,
    movement.balance_after,
    movement.user?.name || 'Unknown',
    movement.notes || '',
  ]);
}

export default function LedgerPanel() {
  const [ledger, setLedger] = useState(null);
  const [ledgerError, setLedgerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [filterOptions, setFilterOptions] = useState({ items: [], people: [] });
  const [filterOptionsError, setFilterOptionsError] = useState('');
  const [printRows, setPrintRows] = useState(null);

  const loadLedger = useCallback(async (page = 1, applied = emptyFilters, preparePrint = true) => {
    setLoading(true);
    setLedgerError('');
    try {
      const response = await api.get('/custodian/ledger', { params: { ...applied, page } });
      setLedger(response.data);

      if (preparePrint) {
        try {
          const printResponse = await api.get('/custodian/ledger/print', { params: applied });
          setPrintRows(printResponse.data);
        } catch (error) {
          setPrintRows(null);
          setLedgerError(error.response?.data?.message || 'Could not prepare the filtered ledger for printing.');
        }
      }
    } catch (error) {
      setLedgerError(error.response?.data?.message || 'Could not load the stock ledger. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/custodian/ledger/filters')
      .then((response) => setFilterOptions(response.data))
      .catch((error) => setFilterOptionsError(error.response?.data?.message || 'Could not load ledger filter options.'));
    const initialLoad = window.setTimeout(() => loadLedger(1, emptyFilters), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadLedger]);

  const applyFilters = (event) => {
    event.preventDefault();
    const nextFilters = { ...filters };
    setAppliedFilters(nextFilters);
    setPrintRows(null);
    loadLedger(1, nextFilters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPrintRows(null);
    loadLedger(1, emptyFilters);
  };

  const report = printRows ? {
    title: 'Stock ledger',
    fileName: 'supplytrack-stock-ledger',
    printTarget: 'ledger',
    details: [
      { label: 'Date from', value: appliedFilters.date_from || 'Any date' },
      { label: 'Date to', value: appliedFilters.date_to || 'Any date' },
      { label: 'Item', value: filterOptions.items.find((item) => String(item.id) === appliedFilters.item_id)?.name || 'All items' },
      { label: 'Person', value: filterOptions.people.find((person) => String(person.id) === appliedFilters.user_id)?.name || 'All people' },
      { label: 'Matching movements', value: printRows.length },
    ],
    columns: ['Date', 'Item', 'Movement', 'Quantity', 'Balance', 'Person', 'Notes'],
    rows: movementRows(printRows),
  } : null;

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div><h2 className="text-lg font-bold text-slate-950">Stock ledger</h2><p className="mt-1 text-sm text-slate-500">A record of every stock addition, adjustment, and item release.</p></div>
          <div className="flex flex-wrap gap-2">
            {report && <ReportExportMenu report={report} buttonLabel="Export / Print ledger" />}
            <button type="button" disabled={loading} onClick={() => loadLedger(ledger?.current_page || 1, appliedFilters)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Refresh ledger</button>
          </div>
        </div>
        <form onSubmit={applyFilters} className="grid gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">From date<input type="date" value={filters.date_from} max={filters.date_to || undefined} onChange={(event) => setFilters((current) => ({ ...current, date_from: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">To date<input type="date" value={filters.date_to} min={filters.date_from || undefined} onChange={(event) => setFilters((current) => ({ ...current, date_to: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Item<select value={filters.item_id} onChange={(event) => setFilters((current) => ({ ...current, item_id: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">All items</option>{filterOptions.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Person<select value={filters.user_id} onChange={(event) => setFilters((current) => ({ ...current, user_id: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">All people</option>{filterOptions.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={loading} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">Apply filters</button>
            <button type="button" disabled={loading} onClick={clearFilters} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Clear filters</button>
          </div>
        </form>
        {filterOptionsError && <p role="alert" className="m-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{filterOptionsError}</p>}
        {ledgerError && <p role="alert" className="m-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{ledgerError}</p>}
        {loading && !ledger ? <p className="p-5 text-sm text-slate-500">Loading stock ledger…</p> : ledger && <MovementTable movements={ledger.data} showItem />}
        {ledger && ledger.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
            <button type="button" disabled={!ledger.prev_page_url || loading} onClick={() => loadLedger(ledger.current_page - 1, appliedFilters, false)} className="font-semibold text-brand-700 disabled:text-slate-400">Previous</button>
            <span className="text-slate-500">Page {ledger.current_page} of {ledger.last_page}</span>
            <button type="button" disabled={!ledger.next_page_url || loading} onClick={() => loadLedger(ledger.current_page + 1, appliedFilters, false)} className="font-semibold text-brand-700 disabled:text-slate-400">Next</button>
          </div>
        )}
      </section>
      {printRows && (
        <section className="print-target print-ledger-target rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">SPC SupplyTrack</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Stock ledger</h2>
            <p className="mt-1 text-sm text-slate-500">Prepared {new Date().toLocaleString()} · {printRows.length} matching movements</p>
          </div>
          <MovementTable movements={printRows} showItem />
        </section>
      )}
    </>
  );
}
