import { useCallback, useEffect, useState } from 'react';
import api from '../../../api/axios';

export default function DepartmentRequestSummary() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/custodian/request-summary');
      setDepartments(response.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load the department request summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadSummary, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadSummary]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Request analytics</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Requests by department</h2>
          <p className="mt-1 text-sm text-slate-500">Counts include all request statuses.</p>
        </div>
        <button type="button" onClick={loadSummary} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Refresh summary</button>
      </div>
      {error && <p role="alert" className="m-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {loading ? (
        <p className="p-5 text-sm text-slate-500">Loading department summary…</p>
      ) : error ? null : (
        departments.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No supply requests have been submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Office or department</th>
                  <th scope="col" className="px-5 py-3">Total</th>
                  <th scope="col" className="px-5 py-3">Pending</th>
                  <th scope="col" className="px-5 py-3">Approved</th>
                  <th scope="col" className="px-5 py-3">Ready</th>
                  <th scope="col" className="px-5 py-3">Released</th>
                  <th scope="col" className="px-5 py-3">Done</th>
                  <th scope="col" className="px-5 py-3">Declined</th>
                  <th scope="col" className="px-5 py-3">Cancelled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((department) => (
                  <tr key={department.department}>
                    <th scope="row" className="px-5 py-3 font-semibold text-slate-900">{department.department}</th>
                    <td className="px-5 py-3 font-semibold tabular-nums text-slate-900">{department.total_requests}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{department.pending_requests}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{department.approved_requests}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{department.ready_requests}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{department.released_requests}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{department.done_requests}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{department.declined_requests}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">{department.cancelled_requests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  );
}
