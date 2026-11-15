import { useState } from 'react';
import { exportReport } from '../../utils/reportExport';

const formats = [
  { value: 'pdf', label: 'Download PDF' },
  { value: 'docx', label: 'Download Word (.docx)' },
  { value: 'csv', label: 'Download spreadsheet (.csv)' },
  { value: 'print', label: 'Print' },
];

export default function ReportExportMenu({ report }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setError('');
    setExporting(true);
    try {
      await exportReport({ ...report, format });
      setOpen(false);
    } catch (exportError) {
      console.error('Could not export report:', exportError);
      setError('Could not export this report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={exporting}
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
      >
        {exporting ? 'Preparing…' : 'Export'}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-10 mt-2 min-w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {formats.map((format) => (
            <button
              key={format.value}
              type="button"
              role="menuitem"
              disabled={exporting}
              onClick={() => handleExport(format.value)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-800 disabled:opacity-50"
            >
              {format.label}
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert" className="absolute right-0 mt-2 w-64 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">{error}</p>}
    </div>
  );
}
