import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

/**
 * FRAGY Redesigned Study Groups Directory Page
 */
function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestingMap, setRequestingMap] = useState({});

  const fetchGroups = () => {
    setLoading(true);
    api
      .getGroups()
      .then((data) => {
        setGroups(data.groups || []);
      })
      .catch((err) => {
        setError(err.message || 'Could not load community groups.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoinRequest = async (groupId) => {
    setRequestingMap((prev) => ({ ...prev, [groupId]: true }));
    try {
      await api.requestToJoinGroup(groupId);
      fetchGroups();
    } catch (err) {
      alert(err.message || 'Could not send join request.');
    } finally {
      setRequestingMap((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const filteredGroups = groups.filter(g =>
    (g.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div className="section-badge" style={{ color: 'var(--color-cyan)', background: 'var(--color-cyan-soft)' }}>
              👥 Peer Collaboration
            </div>
            <h1 style={{ margin: 0 }}>STUDY GROUPS</h1>
            <p className="muted" style={{ margin: 0 }}>Connect, collaborate and learn together.</p>
          </div>

          <Link to="/groups/create" className="btn btn-primary btn-lg">
            + Create Group
          </Link>
        </div>

        {/* SEARCH GROUPS BAR */}
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Search groups by name or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '0.7rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-input-bg)',
              fontSize: '0.95rem'
            }}
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="muted">Loading study groups…</p>
        ) : filteredGroups.length === 0 ? (
          <div className="graphic-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🏢</span>
            <h3>No study groups found</h3>
            <p className="muted">
              {searchQuery ? `No study groups match "${searchQuery}".` : 'Be the first to create a study group for your class!'}
            </p>
            <Link to="/groups/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              + Create Group
            </Link>
          </div>
        ) : (
          <div className="card-grid">
            {filteredGroups.map((g) => {
              const initial = (g.name || '?').charAt(0).toUpperCase();
              return (
                <div key={g.id} className="group-card fade-up" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        background: 'var(--color-brand-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: 'var(--color-brand)',
                        fontSize: '1.4rem',
                        flexShrink: 0,
                      }}
                    >
                      {g.avatarUrl ? (
                        <img src={g.avatarUrl} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initial
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--color-ink)' }}>{g.name}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                        <span className="section-badge" style={{ fontSize: '0.72rem', margin: 0, padding: '0.15rem 0.5rem' }}>
                          👥 {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                        </span>
                        {g.isGroupAdmin && (
                          <span
                            className="section-badge"
                            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.72rem', margin: 0, padding: '0.15rem 0.5rem' }}
                          >
                            👑 Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="muted" style={{ fontSize: '0.88rem', flex: 1, marginBottom: '1rem', lineHeight: 1.5 }}>
                    {g.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                    {g.membershipStatus === 'accepted' || g.isGroupAdmin ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => navigate(`/groups/${g.id}`)}
                      >
                        Open Group & Chat →
                      </button>
                    ) : g.membershipStatus === 'pending' ? (
                      <button type="button" className="btn btn-secondary" disabled style={{ width: '100%', opacity: 0.8 }}>
                        ⏳ Join Request Pending Approval
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                        disabled={requestingMap[g.id]}
                        onClick={() => handleJoinRequest(g.id)}
                      >
                        {requestingMap[g.id] ? 'Submitting...' : '➕ Request to Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Groups;
