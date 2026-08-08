import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken } from '../services/api';

const AuthContext = createContext(null);

/**
 * Provides authentication state to the whole app.
 * Token is stored in localStorage; user profile is loaded from /api/auth/me.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('noteshub_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function register(form) {
    const data = await api.register(form);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function login(form) {
    const data = await api.login(form);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function googleLogin(payload) {
    const data = await api.googleAuth(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    register,
    login,
    googleLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
