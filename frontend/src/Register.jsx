import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api/axios';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    const res = await api.post('/register', form);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    navigate('/inventory');
  } catch (err) {
    const errors = err.response?.data?.errors;
    setError(
      errors
        ? Object.values(errors).flat().join(' ')
        : err.response?.data?.message || err.message
    );
  } finally {
    setLoading(false);
  }
};

  const input =
    'w-full rounded-lg border border-slate-300 px-3.5 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20';
  const label = 'mb-1.5 block text-sm font-semibold text-slate-900';

  return (
    <div className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
      <div className="hidden flex-col justify-center bg-gradient-to-br from-blue-900 to-blue-600 p-12 text-white lg:flex">
        <h1 className="mb-3 text-4xl font-bold">SupplyTrack</h1>
        <p className="max-w-sm text-lg leading-relaxed opacity-90">
          Request and track campus supplies in one place. Browse the inventory,
          submit a request, and follow it until it's released.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8 lg:bg-transparent lg:shadow-none">
          <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">Sign up to request supplies</p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={label}>Full name</label>
              <input id="name" name="name" placeholder="Juan Dela Cruz" required
                value={form.name} onChange={change} className={input} />
            </div>
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" name="email" type="email" placeholder="you@school.edu" required
                value={form.email} onChange={change} className={input} />
            </div>
            <div>
              <label htmlFor="password" className={label}>Password</label>
              <input id="password" name="password" type="password" placeholder="At least 6 characters" required
                value={form.password} onChange={change} className={input} />
            </div>
            <div>
              <label htmlFor="password_confirmation" className={label}>Confirm password</label>
              <input id="password_confirmation" name="password_confirmation" type="password"
                placeholder="Repeat your password" required
                value={form.password_confirmation} onChange={change} className={input} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}