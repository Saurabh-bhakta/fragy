import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken } from '../services/api';

const AuthContext = createContext(null);

/**
 * Provides authentication state to the whole app.
 * Token is stored in localStorage; user profile is loaded from /api/auth/me or /api/profile/me.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function reloadUser() {
    try {
      const data = await api.getProfile();
      if (data?.user) {
        setUser(data.user);
        return data.user;
      }
    } catch {
      // Fall back to /auth/me if getProfile fails
      try {
        const data = await api.me();
        setUser(data.user);
        return data.user;
      } catch {
        setUser(null);
      }
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('noteshub_token');
    if (!token) {
      setLoading(false);
      return;
    }

    reloadUser().finally(() => setLoading(false));
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

  async function updateProfile(formDataOrBody) {
    const data = await api.updateProfile(formDataOrBody);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const isProfileComplete = Boolean(
    user && (user.role === 'admin' || (user.profileCompleted && user.name && user.rollNumber))
  );

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: Boolean(user),
    isProfileComplete,
    isAdmin: user?.role === 'admin',
    register,
    login,
    updateProfile,
    reloadUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
