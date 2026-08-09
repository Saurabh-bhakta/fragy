import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

/**
 * Form a Group page with optional initial member selection.
 */
function CreateGroup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial members search and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchUsers() {
      setSearching(true);
      try {
        const data = await api.getMembers(searchQuery, 1);
        if (isMounted && data.members) {
          setAvailableUsers(data.members);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        if (isMounted) setSearching(false);
      }
    }
    const timer = setTimeout(fetchUsers, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setError('Group icon file size must be less than 1.5MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.createGroup({
        name,
        description,
        avatarUrl,
        initialMemberIds: selectedUserIds,
      });

      if (data.group?.id || data.group?._id) {
        const id = data.group.id || data.group._id;
        navigate(`/groups/${id}`);
      } else {
        navigate('/groups');
      }
    } catch (err) {
      setError(err.message || 'Could not create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page section">
      <div className="container" style={{ maxWidth: '680px' }}>
        <div className="form-card" style={{ width: '100%', margin: 0 }}>
          <div className="section-badge" style={{ marginBottom: '0.75rem' }}>
            <span className="badge-icon">➕</span> New Group
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Form a Study Group</h1>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>
            You will automatically become the Group Admin with full permission to manage members and moderate messages.
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Group Icon (Optional)</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '0.88rem' }} />
                {avatarUrl && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => setAvatarUrl('')}
                  >
                    Clear Icon
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="groupName">Group Name *</label>
              <input
                id="groupName"
                type="text"
                required
                maxLength={100}
                placeholder="e.g. CSE 3rd Sem Study Club or Physics Prep"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="groupDesc">Group Description</label>
              <textarea
                id="groupDesc"
                rows={3}
                maxLength={500}
                placeholder="Describe the group's purpose, rules, or topics..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '0.75rem' }}
              />
              <small className="muted" style={{ display: 'block', textAlign: 'right' }}>
                {description.length}/500
              </small>
            </div>

            {/* Optional Step: Add Initial Members */}
            <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <label style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>
                Add Members (Optional)
              </label>
              <p className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                Select initial members to add to your group immediately.
              </p>

              <input
                type="text"
                placeholder="Search registered members by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: '0.85rem' }}
              />

              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                {searching ? (
                  <p className="muted" style={{ textAlign: 'center', padding: '0.5rem' }}>Searching...</p>
                ) : availableUsers.length === 0 ? (
                  <p className="muted" style={{ textAlign: 'center', padding: '0.5rem' }}>No matching members found.</p>
                ) : (
                  availableUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          background: isSelected ? 'var(--color-brand-soft)' : 'var(--color-bg-card)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <img
                            src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0f766e&color=fff`}
                            alt={u.name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--color-ink)' }}>{u.name}</strong>
                            {u.bio && <span className="muted" style={{ fontSize: '0.75rem' }}>{u.bio.slice(0, 45)}...</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => toggleSelectUser(u.id)}
                        >
                          {isSelected ? 'Added ✓' : '+ Add'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              {selectedUserIds.length > 0 && (
                <span className="muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                  Selected {selectedUserIds.length} member(s) to join.
                </span>
              )}
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '0.85rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating Group...' : 'Create Group 🚀'}
              </button>
              <Link to="/groups" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateGroup;
