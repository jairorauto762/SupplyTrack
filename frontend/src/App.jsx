import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './api/axios';
import Login from './Login';
import Register from './Register';
import InventoryTable from './InventoryTable';

// Only logged-in users can see these pages
function Protected({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

function Inventory() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = async () => {
    try { await api.post('/logout'); } catch (e) { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div>
      <div style={{ padding: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span>Hello, {user.name} ({user.role})</span>
        <button onClick={logout}>Log out</button>
      </div>
      <InventoryTable />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
        <Route path="*" element={<Navigate to="/inventory" />} />
      </Routes>
    </BrowserRouter>
  );
}