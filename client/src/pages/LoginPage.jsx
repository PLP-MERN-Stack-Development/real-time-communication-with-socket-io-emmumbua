import { useState } from 'react';
import { motion } from 'framer-motion';
import { CoffeeIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    favoriteDrink: 'House Blend',
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bean-100 via-bean-50 to-white px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bean-200 text-bean-700 shadow">
            <CoffeeIcon className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-bean-700">BeanStream Lounge</h1>
          <p className="mt-2 text-sm text-bean-400">
            Sip, chat, and connect with fellow coffee enthusiasts in real-time.
          </p>
          <div className="mt-6 flex rounded-full bg-bean-100 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === 'login' ? 'bg-white text-bean-700 shadow' : 'text-bean-400'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === 'register' ? 'bg-white text-bean-700 shadow' : 'text-bean-400'
              }`}
            >
              Join the lounge
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-sm font-medium text-bean-500">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-2xl border border-bean-100 bg-bean-50 px-4 py-3 text-sm text-bean-700 focus:border-bean-400 focus:outline-none"
                placeholder="LatteLover"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-bean-500">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-bean-100 bg-bean-50 px-4 py-3 text-sm text-bean-700 focus:border-bean-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-bean-500">Password</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              required
              minLength={6}
              className="mt-2 w-full rounded-2xl border border-bean-100 bg-bean-50 px-4 py-3 text-sm text-bean-700 focus:border-bean-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-sm font-medium text-bean-500">Favorite drink</label>
              <select
                name="favoriteDrink"
                value={form.favoriteDrink}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-bean-100 bg-bean-50 px-4 py-3 text-sm text-bean-700 focus:border-bean-400 focus:outline-none"
              >
                <option>House Blend</option>
                <option>Iced Caramel Macchiato</option>
                <option>Vanilla Sweet Cream Cold Brew</option>
                <option>Matcha Latte</option>
                <option>Dirty Chai</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-2xl bg-bean-600 py-3 text-sm font-semibold text-white transition hover:bg-bean-500 disabled:cursor-not-allowed disabled:bg-bean-300"
          >
            {loading ? 'Steeping your account...' : mode === 'login' ? 'Enter the lounge' : 'Sign up'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;

