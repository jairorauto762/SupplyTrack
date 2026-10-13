import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './api/axios';
import Login from './Login';
import Register from './Register';
import InventoryDashboard from './pages/InventoryDashboard';

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

// Only logged-in users can access protected routes
function Protected({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// Logged-in users visiting /login or /register are sent straight to /inventory
function PublicOnly({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/inventory" replace /> : children;
}

function Inventory() {
  const navigate = useNavigate();
  const user = getStoredUser() || {};

  const logout = async () => {
    try {
      await api.post('/logout');
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      // Ignore API logout errors and proceed to clear client session
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
        {/* Public Routes (Redirect to /inventory if already logged in) */}
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
            <Protected>
              <Inventory />
            </Protected>
          }
        />

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/inventory" replace />} />
      </Routes>
    </BrowserRouter>
  );
}