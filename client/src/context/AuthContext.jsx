import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext(null);

const LOCAL_STORAGE_KEY = 'beanstream.auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch (error) {
        console.error('Failed to parse stored auth state', error);
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  const persistAuthState = useCallback((nextUser, nextToken) => {
    if (nextUser && nextToken) {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ user: nextUser, token: nextToken })
      );
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      const { token: nextToken, ...userData } = response.data;
      setUser(userData);
      setToken(nextToken);
      persistAuthState(userData, nextToken);
      toast.success(`Welcome back, ${userData.username}!`);
      return userData;
    },
    [persistAuthState]
  );

  const register = useCallback(
    async (payload) => {
      const response = await api.post('/auth/register', payload);
      const { token: nextToken, ...userData } = response.data;
      setUser(userData);
      setToken(nextToken);
      persistAuthState(userData, nextToken);
      toast.success(`Fresh brew ready, ${userData.username}!`);
      return userData;
    },
    [persistAuthState]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    persistAuthState(null, null);
    toast('Catch you at the next coffee break ☕️', { icon: '👋' });
  }, [persistAuthState]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshProfile: async () => {
        if (!token) return null;
        const response = await api.get('/auth/me');
        setUser(response.data);
        persistAuthState(response.data, token);
        return response.data;
      },
    }),
    [loading, login, logout, token, register, user, persistAuthState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

