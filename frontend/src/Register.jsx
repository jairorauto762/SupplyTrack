
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api/axios';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }

      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      if (res.data.token && res.data.user) {
        navigate('/inventory');
      } else {
        setError(
          'Account created, but no login token was returned. Please log in.'
        );
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);

      if (err.response) {
        const status = err.response.status;
        const errors = err.response.data?.errors;

        if (status === 422 && errors) {
          setError(Object.values(errors).flat().join(' '));
        } else if (status === 401 || status === 403) {
          setError('Registration is not authorized. Check your backend settings.');
        } else if (status === 404) {
          setError('Registration API not found. Check your Laravel API route.');
        } else if (status >= 500) {
          setError('Server error. Check your Laravel backend logs.');
        } else {
          setError(
            err.response.data?.message ||
              'Registration failed. Please try again.'
          );
        }
      } else if (err.request) {
        setError(
          'Network Error: Cannot connect to Laravel. Make sure your backend is running and your Axios URL is correct.'
        );
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const input =
    'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20';

  const label = 'mb-1.5 block text-sm font-semibold text-slate-900';

  return (
    <div className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
      {/* Left panel */}
      <div className="hidden flex-col justify-center bg-gradient-to-br from-blue-900 to-blue-600 p-12 text-white lg:flex">
        <h1 className="mb-3 text-4xl font-bold">SupplyTrack</h1>

        <p className="max-w-sm text-lg leading-relaxed opacity-90">
          Request and track campus supplies in one place. Browse the inventory,
          submit a request, and follow it until it's released.
        </p>
      </div>

      {/* Registration form */}
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8 lg:bg-transparent lg:shadow-none">
          <h2 className="text-2xl font-bold text-slate-900">
            Create your account
          </h2>

          <p className="mb-6 mt-1 text-sm text-slate-500">
            Sign up to request supplies
          </p>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={label}>
                Full name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Juan Dela Cruz"
                autoComplete="name"
                required
                value={form.name}
                onChange={change}
                className={input}
              />
            </div>

            <div>
              <label htmlFor="email" className={label}>
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@school.edu"
                autoComplete="email"
                required
                value={form.email}
                onChange={change}
                className={input}
              />
            </div>

            <div>
              <label htmlFor="password" className={label}>
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="new-password"
                minLength={6}
                required
                value={form.password}
                onChange={change}
                className={input}
              />
            </div>

            <div>
              <label htmlFor="password_confirmation" className={label}>
                Confirm password
              </label>

              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                minLength={6}
                required
                value={form.password_confirmation}
                onChange={change}
                className={input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
