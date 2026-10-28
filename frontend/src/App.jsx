import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './api/axios';
import { syncPushSubscription } from './api/pushNotifications';
import Login from './pages/Login';
import Register from './pages/Register';
import InventoryDashboard from './pages/InventoryDashboard';
import CustodianDashboard from './pages/CustodianDashboard';
import CustodianItemDetails from './pages/CustodianItemDetails';
import ItemDetails from './pages/ItemDetails';

// Safe helper to parse user object without crashing on invalid JSON
function getStoredUser() {
  try {
    const item = localStorage.getItem('user');
    return item ? JSON.parse(item) : null;
  } catch (err) {
    console.error('Failed to parse user from localStorage:', err);
    return null;
  }
}

function getDashboardPath() {
  const user = getStoredUser();
  return user?.role === 'custodian' ? '/custodian' : '/inventory';
}

function Protected({ children, role }) {
  const [status, setStatus] = useState(() => (
    localStorage.getItem('token') ? 'checking' : 'unauthenticated'
  ));

  useEffect(() => {
    let active = true;

    if (!localStorage.getItem('token')) {
      return () => {
        active = false;
      };
    }

    api.get('/me')
      .then(({ data }) => {
        if (!active) return;

        localStorage.setItem('user', JSON.stringify(data.user));
        setStatus(data.user.role === role ? 'authorized' : 'forbidden');

        if (data.user.role === role) {
          syncPushSubscription().catch((error) => {
            console.error('Could not sync browser push notifications:', error);
          });
        }
      })
      .catch((error) => {
        if (!active) return;

        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setStatus('unauthenticated');
        } else {
          console.error('Unable to verify the current user:', error);
          setStatus('error');
        }
      });

    return () => {
      active = false;
    };
  }, [role]);

  if (status === 'checking') {
    return <div className="p-6 text-center text-slate-600">Verifying your account...</div>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to={role === 'custodian' ? '/custodian/login' : '/login'} replace />;
  }

  if (status === 'forbidden') {
    return <Navigate to={getDashboardPath()} replace />;
  }

  if (status === 'error') {
    return (
      <div role="alert" className="p-6 text-center text-red-700">
        We could not verify your account. Check that the server is running, then refresh this page.
      </div>
    );
  }

  return children;
}

function PublicOnly({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to={getDashboardPath()} replace /> : children;
}

function Inventory() {
  const navigate = useNavigate();
  const user = getStoredUser() || {};

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  return <InventoryDashboard user={user} onLogout={logout} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes redirect authenticated users to the workspace for their role. */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/custodian/login"
          element={
            <PublicOnly>
              <Login role="custodian" />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />
        <Route
          path="/custodian/register"
          element={
            <PublicOnly>
              <Register role="custodian" />
            </PublicOnly>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/inventory"
          element={
            <Protected role="student">
              <Inventory />
            </Protected>
          }
        />
        <Route
          path="/inventory/items/:itemId"
          element={
            <Protected role="student">
              <StudentItem />
            </Protected>
          }
        />
        <Route
          path="/custodian"
          element={
            <Protected role="custodian">
              <Custodian />
            </Protected>
          }
        />
        <Route
          path="/custodian/items/:itemId"
          element={
            <Protected role="custodian">
              <CustodianItem />
            </Protected>
          }
        />

        {/* Wildcard Fallback */}
        <Route path="*" element={<DashboardRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

function DashboardRedirect() {
  return localStorage.getItem('token')
    ? <Navigate to={getDashboardPath()} replace />
    : <Navigate to="/login" replace />;
}

function Custodian() {
  const navigate = useNavigate();
  const user = getStoredUser() || {};

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  return <CustodianDashboard user={user} onLogout={logout} />;
}

function StudentItem() {
  const navigate = useNavigate();
  const user = getStoredUser() || {};

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  return <ItemDetails user={user} onLogout={logout} />;
}

function CustodianItem() {
  const navigate = useNavigate();
  const user = getStoredUser() || {};

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  return <CustodianItemDetails user={user} onLogout={logout} />;
}