import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

/**
 * Public profile view for a registered member.
 */
function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .getPublicProfile(userId)
      .then((data) => {
        if (!cancelled) {
          setUser(data.user);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'User profile not found.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleStartChat = async () => {
    if (!user) return;
    setChatLoading(true);
    try {
      const data = await api.getOrCreateConversation(user.id);
      if (data.conversation?.id || data.conversation?._id) {
        const convId = data.conversation.id || data.conversation._id;
        navigate(`/chat/${convId}`);
      }
    } catch (err) {
      setError(err.message || 'Could not start chat.');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page section">
        <div className="container">
          <p className="muted">Loading user profile…</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="page section">
        <div className="container">
          <h1>Member not found</h1>
          <p className="muted">{error || 'We could not find the requested user profile.'}</p>
          <Link to="/members" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Members Directory
          </Link>
        </div>
      </div>
    );
  }

  const initial = (user.name || '?').charAt(0).toUpperCase();
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="page section">
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="form-card" style={{ width: '100%', margin: 0, textAlign: 'center' }}>
          <div
            className="avatar"
            style={{
              width: '96px',
              height: '96px',
              margin: '0 auto 1.25rem auto',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--color-brand-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              fontWeight: 700,
              color: 'var(--color-brand)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initial
            )}
          </div>

          <h1 style={{ fontSize: '1.8rem', margin: '0 0 0.4rem' }}>{user.name}</h1>
          <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Member since {joined}
          </p>

          {user.bio ? (
            <div
              style={{
                background: 'var(--color-bg)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}
            >
              <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>
                About Me
              </h4>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{user.bio}</p>
            </div>
          ) : (
            <p className="muted" style={{ fontStyle: 'italic', marginBottom: '1.5rem' }}>
              No bio provided yet.
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleStartChat}
              disabled={chatLoading}
            >
              {chatLoading ? 'Opening Chat...' : '💬 Send Private Message'}
            </button>

            <Link to="/members" className="btn btn-secondary btn-lg">
              ← Back to Members
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;
