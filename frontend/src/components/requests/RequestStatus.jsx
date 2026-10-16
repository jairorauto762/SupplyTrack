const steps = ['Submitted', 'Approved', 'Ready for pickup', 'Released'];
const stepByStatus = { pending: 0, approved: 1, ready: 2, released: 3 };

export default function RequestStatus({ status }) {
  if (status === 'declined') {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
        Request declined
      </div>
    );
  }

  const activeStep = stepByStatus[status] ?? 0;

  return (
    <ol aria-label={`Request status: ${status}`} className="grid grid-cols-4 gap-2">
      {steps.map((step, index) => (
        <li key={step} className="min-w-0">
          <div className={`h-1.5 rounded-full ${index <= activeStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
          <p className={`mt-1.5 text-[10px] leading-4 sm:text-xs ${index <= activeStep ? 'font-semibold text-blue-800' : 'text-slate-400'}`}>
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}
