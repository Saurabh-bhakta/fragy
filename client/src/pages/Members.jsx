import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

/**
 * Members directory page — Search & view registered platform users.
 */
function Members() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMembers = (pageQuery = 1, searchQuery = search) => {
    setLoading(true);
    api
      .getMembers(searchQuery, pageQuery)
      .then((data) => {
        setMembers(data.members || []);
        if (data.pagination) setPagination(data.pagination);
      })
      .catch((err) => {
        setError(err.message || 'Could not load members directory.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMembers(1, '');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMembers(1, search);
  };

  const handleStartChat = async (userId) => {
    try {
      const data = await api.getOrCreateConversation(userId);
      if (data.conversation?.id || data.conversation?._id) {
        const convId = data.conversation.id || data.conversation._id;
        navigate(`/chat/${convId}`);
      }
    } catch (err) {
      alert(err.message || 'Could not open chat.');
    }
  };

  return (
    <div className="page section">
      <div className="container">
        <div className="section-header-row" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div>
            <div className="section-badge">
              <span className="badge-icon">👥</span> Community Directory
            </div>
            <h1>Registered Members</h1>
            <p className="muted">Connect, view public profiles, and chat with fellow students.</p>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: 'min(100%, 360px)' }}>
            <input
              type="text"
              placeholder="Search members by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="doubt-input"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>
              Search
            </button>
          </form>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="muted">Loading community members…</p>
        ) : members.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
            No members found matching your search.
          </div>
        ) : (
          <div className="card-grid" style={{ marginTop: '1.5rem' }}>
            {members.map((m) => {
              const initial = (m.name || '?').charAt(0).toUpperCase();
              return (
                <div key={m.id} className="semester-card fade-up" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--color-brand-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: 'var(--color-brand)',
                        fontSize: '1.2rem',
                        flexShrink: 0,
                      }}
                    >
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initial
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                        {m.name} {m.isSelf && <small className="muted">(You)</small>}
                      </h3>
                      <span className="muted" style={{ fontSize: '0.78rem' }}>
                        Joined {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {m.bio ? (
                    <p className="muted" style={{ fontSize: '0.88rem', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                      {m.bio}
                    </p>
                  ) : (
                    <p className="muted" style={{ fontStyle: 'italic', fontSize: '0.85rem', flex: 1 }}>
                      No bio added yet.
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <Link to={`/profile/${m.id}`} className="btn btn-secondary" style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}>
                      View Profile
                    </Link>
                    {!m.isSelf && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                        onClick={() => handleStartChat(m.id)}
                      >
                        💬 Chat
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            <button
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => fetchMembers(pagination.page - 1)}
            >
              ← Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', fontWeight: 600 }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchMembers(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Members;
