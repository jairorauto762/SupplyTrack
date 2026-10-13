const statusStyles = {
  available: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  unavailable: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  discontinued: 'bg-rose-50 text-rose-700 ring-rose-600/15',
};

export default function StatusBadge({ status }) {
  const normalizedStatus = status?.toLowerCase() || 'unknown';

  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[normalizedStatus] || 'bg-slate-100 text-slate-600 ring-slate-500/15'}`}>
      {normalizedStatus}
    </span>
  );
}
