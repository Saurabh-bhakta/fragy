import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

/**
 * Community Groups Directory page — View, Join, and Access Groups.
 */
function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
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

  return (
    <div className="page section">
      <div className="container">
        <div className="section-header-row" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div>
            <div className="section-badge">
              <span className="badge-icon">🏢</span> Community & Study Clubs
            </div>
            <h1>Study Groups</h1>
            <p className="muted">Form and join student groups to collaborate on notes, projects, and subjects.</p>
          </div>

          <Link to="/groups/create" className="btn btn-primary btn-lg">
            ➕ Form a New Group
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="muted">Loading community groups…</p>
        ) : groups.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🏢</span>
            <h3>No study groups formed yet</h3>
            <p className="muted">Be the first to create a group for your class or semester!</p>
            <Link to="/groups/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Form a Group Now
            </Link>
          </div>
        ) : (
          <div className="card-grid" style={{ marginTop: '1.5rem' }}>
            {groups.map((g) => {
              const initial = (g.name || '?').charAt(0).toUpperCase();
              return (
                <div key={g.id} className="semester-card fade-up" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: 'var(--color-brand-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
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
                      <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{g.name}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                        <span className="badge" style={{ fontSize: '0.75rem' }}>
                          👥 {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                        </span>
                        {g.isGroupAdmin && (
                          <span
                            className="badge"
                            style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', fontSize: '0.75rem', fontWeight: 700 }}
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
                        {requestingMap[g.id] ? 'Submitting Request...' : '➕ Request to Join Group'}
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
