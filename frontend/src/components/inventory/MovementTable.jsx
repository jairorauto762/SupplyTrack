export default function MovementTable({ movements, showItem = false }) {
  if (movements.length === 0) {
    return <p className="p-5 text-sm text-slate-500">No stock movements have been recorded.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            {showItem && <th className="px-4 py-3">Item</th>}
            <th className="px-4 py-3">Movement</th>
            <th className="px-4 py-3">Quantity</th>
            <th className="px-4 py-3">Balance</th>
            <th className="px-4 py-3">Custodian</th>
            <th className="px-4 py-3">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(movement.created_at).toLocaleString()}</td>
              {showItem && <td className="px-4 py-3 text-slate-900">{movement.item?.name || 'Unknown item'} <span className="font-mono text-xs text-slate-500">{movement.item?.item_code}</span></td>}
              <td className="whitespace-nowrap px-4 py-3 font-medium capitalize text-slate-900">{movement.type === 'release' ? 'Released / taken' : movement.type.replace('_', ' ')}</td>
              <td className={`whitespace-nowrap px-4 py-3 font-semibold ${movement.quantity < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{movement.quantity > 0 ? '+' : ''}{movement.quantity}</td>
              <td className="px-4 py-3 text-slate-700">{movement.balance_after}</td>
              <td className="px-4 py-3 text-slate-700">{movement.user?.name || 'Unknown'}</td>
              <td className="px-4 py-3 text-slate-600">{movement.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
