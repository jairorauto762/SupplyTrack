import { useCallback, useEffect, useState } from 'react';
import api from '../../../api/axios';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-800',
  resolved: 'bg-emerald-50 text-emerald-800',
  dismissed: 'bg-slate-100 text-slate-700',
};

export default function MyReportsSection() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/my-reports');
      setReports(response.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your item reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadReports, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadReports]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Inventory feedback</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">My reports</h2>
          <p className="mt-1 text-sm text-slate-500">Check the status of item information reports you submitted.</p>
        </div>
        <button type="button" onClick={loadReports} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Refresh reports</button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading your reports…</p>
      ) : error ? null : reports.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">You have not submitted any item information reports yet.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{report.item?.name || 'Unknown item'}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-500">{report.item?.item_code}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[report.status] || statusStyles.pending}`}>{report.status}</span>
              </div>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{report.issue_description}</p>
              <p className="text-xs text-slate-500">Reported {new Date(report.created_at).toLocaleString()}</p>
              {report.custodian_note && (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-semibold">Custodian note:</span> {report.custodian_note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
