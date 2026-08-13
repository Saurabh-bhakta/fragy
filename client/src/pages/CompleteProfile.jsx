import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function CompleteProfile() {
  const { user, updateProfile, isProfileComplete, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [name, setName] = useState(user?.name || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || '');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    if (user?.rollNumber && !rollNumber) setRollNumber(user.rollNumber);
    if (user?.avatarUrl && !previewUrl) setPreviewUrl(user.avatarUrl);
  }, [user]);

  // Admins bypass profile setup
  if (isAdmin || isProfileComplete) {
    return <Navigate to={redirectTo} replace />;
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5 MB.');
      return;
    }

    setError('');
    setFile(selected);

    // Generate local preview URL
    const objectUrl = URL.createObjectURL(selected);
    setPreviewUrl(objectUrl);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!rollNumber.trim()) {
      setError('Please enter your college/university Roll Number.');
      return;
    }



    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('rollNumber', rollNumber.trim());
      formData.append('bio', bio.trim());

      if (file) {
        formData.append('avatar', file);
      } else if (previewUrl) {
        formData.append('avatarUrl', previewUrl);
      }

      await updateProfile(formData);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page section">
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="form-card" style={{ padding: '36px 30px', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-brand-soft)',
                color: 'var(--color-brand)',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              👤
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-heading, #0f172a)' }}>
              Complete Your Profile
            </h1>
            <p className="muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Please complete your details before accessing study materials and groups.
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Profile Photo Upload & Preview */}
            <div style={{ textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Profile Photo <span className="muted" style={{ fontWeight: 'normal' }}>(Optional)</span>
              </label>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--color-brand)',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      fontSize: '36px',
                      border: '2px dashed #cbd5e1',
                    }}
                  >
                    📷
                  </div>
                )}

                <div>
                  <label
                    htmlFor="avatar-upload"
                    className="btn"
                    style={{
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: '8px 16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: '600',
                      color: '#334155',
                    }}
                  >
                    {previewUrl ? 'Change Photo' : 'Upload Photo'}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label htmlFor="comp-name" style={{ fontWeight: '600', fontSize: '14px' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="comp-name"
                type="text"
                required
                placeholder="e.g. Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Roll Number */}
            <div className="form-group">
              <label htmlFor="comp-roll" style={{ fontWeight: '600', fontSize: '14px' }}>
                Roll Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="comp-roll"
                type="text"
                required
                placeholder="e.g. 21CS045"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                disabled={loading}
              />
              <small className="muted" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Your roll number must be unique across all students.
              </small>
            </div>

            {/* Optional Bio */}
            <div className="form-group">
              <label htmlFor="comp-bio" style={{ fontWeight: '600', fontSize: '14px' }}>
                Bio / About You <span className="muted" style={{ fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <textarea
                id="comp-bio"
                rows={2}
                placeholder="Computer Science student passionate about web dev…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={loading}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Submit Button */}
            <div className="form-actions" style={{ marginTop: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '14px', fontWeight: '600', fontSize: '16px', borderRadius: '10px' }}
              >
                {loading ? 'Saving Profile…' : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CompleteProfile;
