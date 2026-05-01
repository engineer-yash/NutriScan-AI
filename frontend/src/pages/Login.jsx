import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api.js';
import { LogIn, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: 'demo@nutriscan.ai', password: 'Demo@123', fullName: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.email, form.password, form.fullName);
      signIn(res);
      navigate('/analyze');
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-8 space-y-5 animate-fade-up">
        <div className="flex items-center gap-2 text-leaf-700 font-semibold">
          <Leaf size={18}/> {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold">
          {mode === 'login' ? 'Sign in' : 'Register'}
        </h1>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <input
              value={form.fullName} onChange={onChange('fullName')} required
              placeholder="Full name"
              className="w-full border border-leaf-200 rounded-xl px-4 py-3 focus:border-leaf-500 outline-none"
              data-testid="fullname-input"
            />
          )}
          <input
            type="email" value={form.email} onChange={onChange('email')} required
            placeholder="Email"
            className="w-full border border-leaf-200 rounded-xl px-4 py-3 focus:border-leaf-500 outline-none"
            data-testid="email-input"
          />
          <input
            type="password" value={form.password} onChange={onChange('password')} required
            placeholder="Password"
            className="w-full border border-leaf-200 rounded-xl px-4 py-3 focus:border-leaf-500 outline-none"
            data-testid="password-input"
          />

          {error && <p className="text-sm text-red-600" data-testid="auth-error">{error}</p>}

          <button className="btn-primary w-full justify-center" disabled={loading} data-testid="auth-submit">
            {loading ? 'Please wait…' : (mode === 'login' ? <><LogIn size={16}/> Sign in</> : 'Create account')}
          </button>
        </form>

        <p className="text-sm text-neutral-500 text-center">
          {mode === 'login' ? 'No account?' : 'Already registered?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-leaf-700 font-semibold"
            data-testid="auth-mode-toggle"
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}