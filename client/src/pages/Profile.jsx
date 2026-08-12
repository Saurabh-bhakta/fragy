import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * User profile page — Edit Name, Roll Number, Bio, Profile Photo + Change Password.
 */
function Profile() {
  const { user: authUser, updateProfile: updateAuthProfile, logout } = useAuth();

  const [profile, setProfile] = useState({
    name: authUser?.name || '',
    email: authUser?.email || '',
    rollNumber: authUser?.rollNumber || '',
    bio: authUser?.bio || '',
    avatarUrl: authUser?.avatarUrl || '',
    createdAt: authUser?.createdAt || null,
  });

  const [file, setFile] = useState(null);
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
            rollNumber: data.user.rollNumber || '',
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

  const handleImageSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setProfileError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setProfileError('Image size must be less than 5 MB.');
      return;
    }

    setProfileError('');
    setFile(selected);

    const objectUrl = URL.createObjectURL(selected);
    setProfile((prev) => ({ ...prev, avatarUrl: objectUrl }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');

    if (!profile.name.trim()) {
      setProfileError('Name is mandatory and cannot be empty.');
      return;
    }
    if (!profile.rollNumber.trim()) {
      setProfileError('Roll Number is mandatory and cannot be empty.');
      return;
    }


    setProfileLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', profile.name.trim());
      formData.append('rollNumber', profile.rollNumber.trim());
      formData.append('bio', profile.bio.trim());

      if (file) {
        formData.append('avatar', file);
      } else if (profile.avatarUrl) {
        formData.append('avatarUrl', profile.avatarUrl);
      }

      const updatedUser = await updateAuthProfile(formData);
      setProfileMessage('Profile updated successfully!');
      if (updatedUser) {
        setProfile((prev) => ({
          ...prev,
          name: updatedUser.name,
          rollNumber: updatedUser.rollNumber,
          bio: updatedUser.bio || '',
          avatarUrl: updatedUser.avatarUrl,
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
                width: '96px',
                height: '96px',
                margin: '0 auto 1rem auto',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--color-brand-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.25rem',
                fontWeight: 700,
                color: 'var(--color-brand)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '3px solid #0f766e',
              }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initial
              )}
            </div>

            <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.25rem' }}>{profile.name}</h1>
            <p className="muted" style={{ margin: '0 0 0.25rem', fontWeight: '600' }}>
              Roll Number: <span style={{ color: '#0f766e' }}>{profile.rollNumber || 'Not set'}</span>
            </p>
            <p className="muted" style={{ margin: '0 0 0.5rem' }}>{profile.email}</p>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Member since {joined}</p>
          </div>

          {profileError && <div className="alert alert-error">{profileError}</div>}
          {profileMessage && <div className="alert alert-success">{profileMessage}</div>}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label style={{ fontWeight: '600' }}>Profile Photo <span className="muted" style={{ fontWeight: 'normal' }}>(Optional)</span></label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label
                  htmlFor="profile-file-input"
                  className="btn btn-secondary"
                  style={{ cursor: 'pointer', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  Change Photo
                </label>
                <input
                  id="profile-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <small className="muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                Upload a photo (PNG, JPG, WebP up to 5MB).
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="profileName" style={{ fontWeight: '600' }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
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
              <label htmlFor="profileRoll" style={{ fontWeight: '600' }}>Roll Number <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                id="profileRoll"
                type="text"
                required
                value={profile.rollNumber}
                onChange={(e) => setProfile((p) => ({ ...p, rollNumber: e.target.value }))}
              />
              <small className="muted" style={{ fontSize: '12px', marginTop: '2px', display: 'block' }}>
                Roll numbers must be unique across all students.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="profileBio" style={{ fontWeight: '600' }}>Bio / About Me</label>
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
