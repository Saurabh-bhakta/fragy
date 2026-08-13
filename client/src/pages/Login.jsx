import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page section">
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="form-card" style={{ padding: '32px 28px', borderRadius: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--color-heading, #0f172a)' }}>
              Sign In to Fragy
            </h1>
            <p className="muted" style={{ fontSize: '14px' }}>
              Access semester study materials, groups, and announcements.
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', fontWeight: '600' }}
              >
                {loading ? 'Signing in…' : 'Login'}
              </button>
            </div>
          </form>

          <p className="form-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
            New to Fragy?{' '}
            <Link to="/register" style={{ color: 'var(--color-brand)', fontWeight: '600' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
