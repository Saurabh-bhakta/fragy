import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

/**
 * FRAGY Redesigned Members Directory Page
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div className="section-badge" style={{ color: 'var(--color-cyan)', background: 'var(--color-cyan-soft)' }}>
              👤 Student Directory
            </div>
            <h1 style={{ margin: 0 }}>Campus Members</h1>
            <p className="muted" style={{ margin: 0 }}>Connect, view student profiles, and collaborate with your peers.</p>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: 'min(100%, 360px)' }}>
            <input
              type="text"
              placeholder="Search members by name or roll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-input-bg)',
                fontSize: '0.9rem'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.1rem', fontSize: '0.9rem' }}>
              Search
            </button>
          </form>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="muted">Loading student directory…</p>
        ) : members.length === 0 ? (
          <div className="graphic-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <p className="muted" style={{ margin: 0 }}>No campus members found matching "{search}".</p>
          </div>
        ) : (
          <div className="card-grid">
            {members.map((m) => {
              const initial = (m.name || '?').charAt(0).toUpperCase();
              return (
                <div key={m.id} className="graphic-card fade-up" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--color-brand-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: 'var(--color-brand)',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                        border: '2px solid var(--color-border)'
                      }}
                    >
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initial
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-ink)' }}>
                        {m.name} {m.isSelf && <small className="muted">(You)</small>}
                      </h3>
                      {m.rollNumber && (
                        <div className="muted" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-brand)' }}>
                          Roll: {m.rollNumber}
                        </div>
                      )}
                      <span className="muted" style={{ fontSize: '0.78rem' }}>
                        Member since {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="muted" style={{ fontSize: '0.86rem', flex: 1, marginBottom: '1rem', lineHeight: '1.5' }}>
                    {m.bio || 'Student at Fragy Digital Campus.'}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
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

        {/* PAGINATION */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => fetchMembers(pagination.page - 1)}
            >
              ← Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>
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
