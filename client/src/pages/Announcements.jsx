import { useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * FRAGY Redesigned Announcements Page — Premium Bulletin & Feed
 */
function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getAnnouncements()
      .then((data) => {
        if (!cancelled) {
          setAnnouncements(data.announcements || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load announcements.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAnnouncements = announcements.filter((ann) => {
    if (filter === 'All') return true;
    if (filter === 'Important') return ann.isPinned || ann.category === 'Important';
    if (filter === 'Academic') return ann.category === 'Academic' || ann.title.toLowerCase().includes('exam') || ann.title.toLowerCase().includes('notes');
    if (filter === 'General') return !ann.isPinned;
    return true;
  });

  return (
    <div className="page section">
      <div className="container">
        <div className="section-header">
          <div className="section-badge" style={{ color: 'var(--color-accent)', background: 'rgba(168, 85, 247, 0.12)' }}>
            📢 Campus Bulletin
          </div>
          <h1>Announcements & Updates</h1>
          <p className="muted">
            Stay updated with recent course uploads, exam schedules, and site updates from the Fragy team.
          </p>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {['All', 'Important', 'Academic', 'General'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn ${filter === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(cat)}
              style={{ padding: '0.4rem 1rem', fontSize: '0.88rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="muted">Loading campus announcements…</p>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="graphic-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
            <h3>No announcements in this category.</h3>
            <p className="muted">Check back later for updates regarding new study materials and course content.</p>
          </div>
        ) : (
          <div className="card-grid">
            {filteredAnnouncements.map((ann) => (
              <div
                key={ann.id || ann._id}
                className={`announcement-card fade-up ${ann.isPinned ? 'important' : ''}`}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="section-badge" style={{ fontSize: '0.72rem', margin: 0, padding: '0.2rem 0.6rem' }}>
                    {ann.isPinned ? '📌 PINNED' : ann.category || 'BULLETIN'}
                  </span>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>
                    {new Date(ann.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--color-ink)' }}>{ann.title}</h3>
                <p className="muted" style={{ fontSize: '0.92rem', margin: 0, lineHeight: '1.6', flex: 1 }}>
                  {ann.message}
                </p>

                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-ink-subtle)' }}>
                  Posted by <strong>{ann.createdBy?.name || 'Fragy Admin'}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Announcements;
