import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatusBadge from '../components/inventory/StatusBadge';
import StockBadge from '../components/inventory/StockBadge';
import { addItemToRequestCart } from '../components/requests/requestCart';

export default function ItemDetails({ user, onLogout }) {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    api.get(`/items/${itemId}`, { signal: controller.signal })
      .then((response) => {
        setItem(response.data);
        setImageFailed(false);
      })
      .catch((requestError) => {
        if (!axios.isCancel(requestError)) {
          setError(requestError.response?.status === 404
            ? 'This inventory item could not be found.'
            : 'Could not load item details. Please try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [itemId]);

  const addToRequest = () => {
    addItemToRequestCart(item);
    navigate('/inventory');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardHeader user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <Link to={user.role === 'custodian' ? '/custodian?section=items' : '/inventory'} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
          <span aria-hidden="true">←</span> Back to inventory
        </Link>

        {error ? (
          <section role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-800 shadow-sm">
            {error}
          </section>
        ) : loading ? (
          <section aria-label="Loading item details" className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-72 rounded-xl bg-slate-100" />
            <div className="mt-5 h-6 w-1/2 rounded bg-slate-100" />
            <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
          </section>
        ) : item && (
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="flex min-h-72 items-center justify-center bg-slate-100 p-6 md:min-h-[28rem]">
                {item.photo_url && !imageFailed ? (
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    onError={() => setImageFailed(true)}
                    className="max-h-[26rem] w-full rounded-xl object-contain"
                  />
                ) : (
                  <div className="flex h-56 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400">
                    <svg aria-hidden="true" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="m4 7.5 8-4.5 8 4.5v9L12 21l-8-4.5v-9ZM4 7.5l8 4.5m0 0 8-4.5M12 12v9" />
                    </svg>
                    <p className="mt-3 text-sm font-medium">No item photo available</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col p-5 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.category?.name || 'Uncategorized'}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-5 font-mono text-xs font-semibold tracking-wide text-slate-500">{item.item_code}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{item.name}</h1>
                {item.description && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{item.description}</p>}

                <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current stock</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-slate-950">{item.stock_quantity}</p>
                  <div className="mt-2"><StockBadge item={item} /></div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Unit price</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{Number(item.price).toLocaleString(undefined, { style: 'currency', currency: 'PHP' })}</p>
                </div>

                {item.specs && (
                  <section className="mt-6">
                    <h2 className="text-sm font-bold text-slate-900">Specifications</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.specs}</p>
                  </section>
                )}

                {user.role === 'student' && (
                  <div className="mt-auto pt-7">
                    <button
                      type="button"
                      onClick={addToRequest}
                      disabled={item.stock_quantity < 1 || item.status !== 'available'}
                      className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {item.stock_quantity < 1 || item.status !== 'available' ? 'Currently unavailable' : 'Add to supply request'}
                    </button>
                    <p className="mt-2 text-center text-xs text-slate-500">Stock is checked again when you submit your request.</p>
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
