import { useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * Dedicated Announcements page accessible from Navbar.
 */
function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
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

  return (
    <div className="page section">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <span className="badge-icon">📢</span> Updates & Announcements
          </div>
          <h1>Platform Announcements</h1>
          <p className="muted">
            Stay updated with recent course uploads, site updates, and notices from the Fragy team.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p className="muted">Loading announcements…</p>
        ) : announcements.length === 0 ? (
          <div className="announcement-empty-card">
            <span className="empty-icon">📭</span>
            <div>
              <h4>No announcements at the moment.</h4>
              <p className="muted">Check back later for updates regarding new study materials and course content.</p>
            </div>
          </div>
        ) : (
          <div className="announcements-grid">
            {announcements.map((ann) => (
              <div key={ann.id || ann._id} className="announcement-card fade-up">
                <div className="announcement-header">
                  <div className="announcement-title-wrap">
                    <h3>{ann.title}</h3>
                    {ann.isNew && <span className="new-badge">NEW</span>}
                  </div>
                  <span className="announcement-date">
                    {new Date(ann.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="announcement-message">{ann.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Announcements;
