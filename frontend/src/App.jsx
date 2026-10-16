import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './api/axios';
import Login from './pages/Login';
import Register from './pages/Register';
import InventoryDashboard from './pages/InventoryDashboard';
import CustodianDashboard from './pages/CustodianDashboard';

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
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = getStoredUser();
  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  return role && user?.role !== role
    ? <Navigate to={getDashboardPath()} replace />
    : children;
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
          path="/register"
          element={
            <PublicOnly>
              <Register />
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
          path="/custodian"
          element={
            <Protected role="custodian">
              <Custodian />
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