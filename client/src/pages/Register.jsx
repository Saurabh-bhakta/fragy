import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/complete-profile" replace />;
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      navigate('/complete-profile', { replace: true });
    } catch (err) {
      const details = err.data?.errors?.map((x) => x.msg).join(' ');
      setError(details || err.message || 'Registration failed');
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
              Create an Account
            </h1>
            <p className="muted" style={{ fontSize: '14px' }}>
              Register with your email to access Fragy study materials.
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={update('name')}
                placeholder="Alex Mercer"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@college.edu"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
                placeholder="Minimum 6 characters"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="Re-enter password"
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
                {loading ? 'Creating Account…' : 'Register & Setup Profile'}
              </button>
            </div>
          </form>

          <p className="form-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0f766e', fontWeight: '600' }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
