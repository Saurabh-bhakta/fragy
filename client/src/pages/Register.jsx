import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';

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
    return <Navigate to="/" replace />;
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
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      const details = err.data?.errors?.map((x) => x.msg).join(' ');
      setError(details || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page section">
      <div className="container">
        <div className="form-card">
          <h1>Create account</h1>
          <p className="muted">Join Fragy to access semester-wise materials.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <GoogleAuthButton
            label="Sign up with Google"
            onError={(errMsg) => setError(errMsg)}
          />

          <div className="auth-divider">
            <span>or register with email</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input id="name" required value={form.name} onChange={update('name')} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@college.edu"
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
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Register'}
              </button>
            </div>
          </form>

          <p className="form-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
