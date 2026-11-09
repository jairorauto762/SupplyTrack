import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import RequestReceipt from '../../components/requests/RequestReceipt';
import AddItemForm from './components/AddItemForm';
import ItemsPanel from './components/ItemsPanel';
import LedgerPanel from './components/LedgerPanel';
import PickListDialog from './components/PickListDialog';
import RequestsPanel from './components/RequestsPanel';

export default function CustodianDashboard({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('section') === 'items' ? 'items' : 'requests');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');
  const [pageError, setPageError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');
  const [busyRequest, setBusyRequest] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [pickList, setPickList] = useState(null);
  const [pickListError, setPickListError] = useState('');
  const [ledger, setLedger] = useState(null);
  const [ledgerError, setLedgerError] = useState('');
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const response = await api.get('/custodian/requests');
      setRequests(response.data);
      setPageError('');
    } catch (error) {
      setPageError(error.response?.data?.message || 'Could not load supply requests. Please refresh to try again.');
    }
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const response = await api.get('/custodian/items');
      setInventoryItems(response.data);
      setInventoryError('');
    } catch (error) {
      setInventoryError(error.response?.data?.message || 'Could not load inventory items. Please try again.');
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  const loadLedger = useCallback(async (page = 1) => {
    setLedgerLoading(true);
    try {
      const response = await api.get(`/custodian/ledger?page=${page}`);
      setLedger(response.data);
      setLedgerError('');
    } catch (error) {
      setLedgerError(error.response?.data?.message || 'Could not load the stock ledger. Please try again.');
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/categories')
      .then((response) => setCategories(response.data))
      .catch((error) => setCategoriesError(error.response?.data?.message || 'Could not load inventory categories.'));

    const initialRequestLoad = window.setTimeout(loadRequests, 0);
    const requestTimer = window.setInterval(loadRequests, 15000);
    const initialInventoryLoad = window.setTimeout(loadInventory, 0);
    return () => {
      window.clearTimeout(initialRequestLoad);
      window.clearInterval(requestTimer);
      window.clearTimeout(initialInventoryLoad);
    };
  }, [loadInventory, loadRequests]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      const initialLedgerLoad = window.setTimeout(loadLedger, 0);
      return () => window.clearTimeout(initialLedgerLoad);
    }
    return undefined;
  }, [activeTab, loadLedger]);

  const runRequestAction = async (request, action) => {
    setBusyRequest(request.id);
    setPageError('');
    try {
      const response = await api.post(`/custodian/requests/${request.id}/${action}`);
      await loadRequests();
      if (action === 'release') {
        setReceipt(response.data.data);
      }
    } catch (error) {
      setPageError(error.response?.data?.message || `Could not ${action} request #${request.id}.`);
    } finally {
      setBusyRequest(null);
    }
  };

  const handleRequestAction = (request, action) => {
    if (action === 'decline') {
      if (window.confirm(`Decline request #${request.id}?`)) {
        runRequestAction(request, action);
      }
      return;
    }

    runRequestAction(request, action);
  };

  const showPickList = async () => {
    setPickListError('');
    try {
      const response = await api.get('/custodian/pick-list');
      setPickList(response.data);
    } catch (error) {
      setPickListError(error.response?.data?.message || 'Could not prepare the approved-request pick list.');
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'pending').length;
  const activeRequestsCount = requests.filter((request) => ['approved', 'ready'].includes(request.status)).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="print-hidden"><DashboardHeader user={user} onLogout={onLogout} /></div>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">Custodian workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Supply desk</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review requests, prepare pickups, and manage the campus inventory.</p>
          </div>
          <div className="flex flex-wrap gap-2 print-hidden">
            <button type="button" onClick={showPickList} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Prepare pick list</button>
            <button type="button" onClick={() => setActiveTab('add')} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Add inventory item</button>
          </div>
        </section>

        {pageError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{pageError}</p>}
        {categoriesError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{categoriesError}</p>}
        {pickListError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{pickListError}</p>}

        <nav aria-label="Custodian workspace sections" className="print-hidden flex gap-2 overflow-x-auto border-b border-slate-200">
          <button type="button" onClick={() => setActiveTab('requests')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'requests' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500'}`}>
            Requests {pendingCount > 0 && <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800">{pendingCount}</span>}
          </button>
          <button type="button" onClick={() => setActiveTab('items')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'items' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500'}`}>All items</button>
          <button type="button" onClick={() => setActiveTab('ledger')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'ledger' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500'}`}>Stock ledger</button>
          <button type="button" onClick={() => setActiveTab('add')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'add' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500'}`}>Add inventory</button>
        </nav>

        {activeTab === 'requests' && (
          <RequestsPanel
            requests={requests}
            busyRequest={busyRequest}
            onAction={handleRequestAction}
            onRefresh={loadRequests}
          />
        )}
        {activeTab === 'items' && (
          <ItemsPanel
            items={inventoryItems}
            loading={inventoryLoading}
            error={inventoryError}
            onRefresh={loadInventory}
            onAdd={() => setActiveTab('add')}
          />
        )}
        {activeTab === 'ledger' && (
          <LedgerPanel
            ledger={ledger}
            error={ledgerError}
            loading={ledgerLoading}
            onRefresh={() => loadLedger(ledger?.current_page || 1)}
            onPageChange={loadLedger}
          />
        )}
        {activeTab === 'add' && (
          <AddItemForm
            categories={categories}
            categoriesError={categoriesError}
            onAdded={loadInventory}
          />
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Pending requests</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Approved / preparing</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{activeRequestsCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Queue refreshed</p>
            <p className="mt-2 text-base font-bold text-slate-950">{new Date().toLocaleTimeString()}</p>
            <p className="mt-1 text-xs text-slate-500">Updates automatically every 15 seconds</p>
          </div>
        </section>

        <PickListDialog requests={pickList} onClose={() => setPickList(null)} />
        {receipt && <RequestReceipt request={receipt} onClose={() => setReceipt(null)} />}
      </main>
    </div>
  );
}
