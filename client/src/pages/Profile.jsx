import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * User profile — account info + change password form.
 */
function Profile() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const initial = (user.name || '?').charAt(0).toUpperCase();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.changePassword(form);
      setMessage(data.message || 'Password updated successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const details = err.data?.errors?.map((x) => x.msg).join(' ');
      setError(details || err.message || 'Could not change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page section">
      <div className="container" style={{ display: 'grid', gap: '1.25rem', justifyItems: 'center' }}>
        <div className="profile-card">
          <div className="avatar" aria-hidden="true">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initial}
          </div>
          <h1>{user.name}</h1>
          <p className="muted">{user.email}</p>

          <p>
            <strong>Member since:</strong> {joined}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-primary">
              Browse materials
            </Link>
            <button type="button" className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="profile-card">
          <h2>Change password</h2>
          <p className="muted">Enter your current password, then choose a new one.</p>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current password</label>
              <input
                id="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={update('currentPassword')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New password</label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.newPassword}
                onChange={update('newPassword')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm new password</label>
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
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
