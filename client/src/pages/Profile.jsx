import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * User profile page — Edit Name, Bio, Profile Picture + Change Password.
 */
function Profile() {
  const { user: authUser, logout } = useAuth();

  const [profile, setProfile] = useState({
    name: authUser?.name || '',
    email: authUser?.email || '',
    bio: '',
    avatarUrl: '',
    createdAt: authUser?.createdAt || null,
  });

  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getProfile()
      .then((data) => {
        if (!cancelled && data.user) {
          setProfile({
            name: data.user.name || '',
            email: data.user.email || '',
            bio: data.user.bio || '',
            avatarUrl: data.user.avatarUrl || '',
            createdAt: data.user.createdAt,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!authUser) return null;

  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const initial = (profile.name || '?').charAt(0).toUpperCase();

  // Handle local image file upload & conversion to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setProfileError('Image size must be less than 1.5 MB.');
      return;
    }

    setProfileError('');
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setProfileLoading(true);

    try {
      const data = await api.updateProfile({
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      });
      setProfileMessage(data.message || 'Profile updated successfully!');
      if (data.user) {
        setProfile((prev) => ({
          ...prev,
          name: data.user.name,
          bio: data.user.bio,
          avatarUrl: data.user.avatarUrl,
        }));
      }
    } catch (err) {
      setProfileError(err.message || 'Could not update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const data = await api.changePassword(passwordForm);
      setPasswordMessage(data.message || 'Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const details = err.data?.errors?.map((x) => x.msg).join(' ');
      setPasswordError(details || err.message || 'Could not change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page section">
      <div className="container" style={{ display: 'grid', gap: '2rem', maxWidth: '720px' }}>
        
        {/* Profile Card & Info */}
        <div className="form-card" style={{ width: '100%', margin: 0 }}>
          <div className="profile-header-meta" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              className="avatar"
              style={{
                width: '90px',
                height: '90px',
                margin: '0 auto 1rem auto',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--color-brand-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--color-brand)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initial
              )}
            </div>

            <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.25rem' }}>{profile.name}</h1>
            <p className="muted" style={{ margin: '0 0 0.5rem' }}>{profile.email}</p>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Member since {joined}</p>
          </div>

          {profileError && <div className="alert alert-error">{profileError}</div>}
          {profileMessage && <div className="alert alert-success">{profileMessage}</div>}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Profile Picture</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ fontSize: '0.88rem' }}
                />
                {profile.avatarUrl && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => setProfile((p) => ({ ...p, avatarUrl: '' }))}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <small className="muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                Upload a photo (PNG, JPG, WebP up to 1.5MB).
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="profileName">Full Name</label>
              <input
                id="profileName"
                type="text"
                required
                maxLength={80}
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="profileBio">Bio / About Me</label>
              <textarea
                id="profileBio"
                rows={3}
                maxLength={300}
                placeholder="Share a short bio about yourself, courses, or interests..."
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem' }}
              />
              <small className="muted" style={{ display: 'block', textAlign: 'right' }}>
                {profile.bio.length}/300
              </small>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="form-card" style={{ width: '100%', margin: 0 }}>
          <h2>Change Password</h2>
          <p className="muted">Enter your current password, then choose a new one.</p>

          {passwordError && <div className="alert alert-error">{passwordError}</div>}
          {passwordMessage && <div className="alert alert-success">{passwordMessage}</div>}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Profile;
