import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';

export default function ItemReportsPanel() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [notes, setNotes] = useState({});
  const [reviewingReport, setReviewingReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/custodian/item-reports');
      setReports(response.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load item information reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadReports, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadReports]);

  const reviewReport = async (report, status) => {
    setReviewError('');
    setReviewingReport(report.id);
    try {
      const response = await api.patch(`/custodian/item-reports/${report.id}`, {
        status,
        custodian_note: notes[report.id] ?? report.custodian_note ?? '',
      });
      setReports((current) => current.map((entry) => entry.id === report.id ? response.data.data : entry));
      setNotes((current) => ({ ...current, [report.id]: response.data.data.custodian_note || '' }));
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setReviewError(errors ? Object.values(errors).flat().join(' ') : requestError.response?.data?.message || 'Could not update this report. Please try again.');
    } finally {
      setReviewingReport(null);
    }
  };

  const filteredReports = reports.filter((report) => statusFilter === 'all' || report.status === statusFilter);
  const statusStyles = {
    pending: 'bg-amber-50 text-amber-800',
    resolved: 'bg-emerald-50 text-emerald-800',
    dismissed: 'bg-slate-100 text-slate-700',
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Inventory feedback</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Item information reports</h2>
          <p className="mt-1 text-sm text-slate-500">Review details students have flagged as incorrect.</p>
        </div>
        <button type="button" onClick={loadReports} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Refresh reports</button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {reviewError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{reviewError}</p>}
      <label className="block max-w-xs text-sm font-medium text-slate-700">
        Filter reports
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </label>
      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading item reports…</p>
      ) : error ? null : (
        filteredReports.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {reports.length === 0 ? 'There are no item information reports yet.' : 'No reports match this status.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredReports.map((report) => (
              <li key={report.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{report.item?.name || 'Unknown item'} <span className="font-mono text-xs font-medium text-slate-500">{report.item?.item_code}</span></h3>
                    <p className="mt-1 text-sm text-slate-500">Reported by {report.user?.name || 'Unknown user'} · {report.user?.department || 'Department not specified'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[report.status] || statusStyles.pending}`}>{report.status}</span>
                </div>
                <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{report.issue_description}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>Reported {new Date(report.created_at).toLocaleString()}</span>
                  {report.reviewed_at && <span>Reviewed {new Date(report.reviewed_at).toLocaleString()}</span>}
                </div>
                {report.custodian_note && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><span className="font-semibold">Custodian note:</span> {report.custodian_note}</p>}
                <label className="block text-sm font-medium text-slate-700">
                  Custodian note (optional)
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={notes[report.id] ?? report.custodian_note ?? ''}
                    onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={reviewingReport === report.id} onClick={() => reviewReport(report, 'resolved')} className="rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                    {reviewingReport === report.id ? 'Saving…' : 'Mark as resolved'}
                  </button>
                  <button type="button" disabled={reviewingReport === report.id} onClick={() => reviewReport(report, 'dismissed')} className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                    Dismiss
                  </button>
                  {report.item?.id && <Link to={`/custodian/items/${report.item.id}`} className="rounded-lg border border-brand-200 px-3.5 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">Edit item</Link>}
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}
