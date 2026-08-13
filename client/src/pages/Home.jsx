import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import SemesterCard from '../components/SemesterCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { semesters as fallbackSemesters } from '../data/semesters';

/**
 * FRAGY Redesigned Home Page — Digital Campus for Students
 */
function Home() {
  const { user, isAuthenticated } = useAuth();
  const [semesters, setSemesters] = useState(fallbackSemesters);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [error, setError] = useState('');

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    let cancelled = false;

    // Load semesters
    api.getSemesters()
      .then((data) => {
        if (cancelled) return;
        const list = (data.semesters || []).map((s) => ({
          id: s._id || s.id,
          number: s.number,
          name: s.name,
          description: s.description,
          subjectCount: s.subjectCount ?? 0,
        }));
        if (list.length) setSemesters(list);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Showing sample semesters — connect backend for live database records.');
        }
      });

    // Load latest announcements
    api.getAnnouncements()
      .then((data) => {
        if (!cancelled) {
          setAnnouncements((data.announcements || []).slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingAnnouncements(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      {/* PERSONALIZED USER BANNER (IF LOGGED IN) */}
      {isAuthenticated && user && (
        <section style={{ padding: '1.5rem 0 0', background: 'var(--color-brand-soft)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
                {getGreeting()}, <span style={{ color: 'var(--color-brand)' }}>{user.name}</span>. 👋
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: '0.92rem' }}>
                Ready to continue learning on your digital campus?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/profile" className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                View Profile
              </Link>
              <Link to="/groups" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                My Groups
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* HERO SECTION */}
      <Hero />

      {/* QUICK ACCESS SECTION */}
      <section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '2.5rem' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <div className="section-badge">⚡ Navigation</div>
            <h2>Quick Access</h2>
            <p>Direct entry points to campus resources, announcements, and peer networks.</p>
          </div>

          <div className="quick-access-grid">
            <a href="#semesters" className="quick-access-card">
              <span className="quick-access-icon">📚</span>
              <span className="quick-access-title">Semesters</span>
              <span className="quick-access-desc">Explore your semesters</span>
            </a>

            <Link to="/semester/1" className="quick-access-card">
              <span className="quick-access-icon">📄</span>
              <span className="quick-access-title">Notes</span>
              <span className="quick-access-desc">Browse study materials</span>
            </Link>

            <Link to="/announcements" className="quick-access-card">
              <span className="quick-access-icon">📢</span>
              <span className="quick-access-title">Announcements</span>
              <span className="quick-access-desc">See campus updates</span>
            </Link>

            <Link to="/groups" className="quick-access-card">
              <span className="quick-access-icon">👥</span>
              <span className="quick-access-title">Study Groups</span>
              <span className="quick-access-desc">Learn together</span>
            </Link>

            <Link to="/chat" className="quick-access-card">
              <span className="quick-access-icon">💬</span>
              <span className="quick-access-title">Community</span>
              <span className="quick-access-desc">Connect and chat</span>
            </Link>

            <Link to="/members" className="quick-access-card">
              <span className="quick-access-icon">👤</span>
              <span className="quick-access-title">Members</span>
              <span className="quick-access-desc">Discover students</span>
            </Link>
          </div>
        </div>
      </section>

      {/* LATEST ANNOUNCEMENTS SECTION */}
      <section className="section" style={{ padding: '2.5rem 0', background: 'var(--color-surface-glass)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <div className="section-badge" style={{ color: 'var(--color-accent)', background: 'rgba(168, 85, 247, 0.12)' }}>📢 Bulletin</div>
              <h2 style={{ margin: 0 }}>Latest Announcements</h2>
            </div>
            <Link to="/announcements" className="btn btn-secondary" style={{ fontSize: '0.88rem' }}>
              View all announcements →
            </Link>
          </div>

          {loadingAnnouncements ? (
            <div className="muted">Loading campus announcements...</div>
          ) : announcements.length > 0 ? (
            <div className="card-grid">
              {announcements.map((ann) => (
                <div key={ann._id} className={`announcement-card ${ann.isPinned ? 'important' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>📢</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-ink)' }}>{ann.title}</strong>
                  </div>
                  <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                    {ann.message?.length > 110 ? ann.message.substring(0, 110) + '...' : ann.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--color-ink-subtle)' }}>
                    <span>By {ann.createdBy?.name || 'Admin'} · {new Date(ann.createdAt).toLocaleDateString()}</span>
                    <Link to="/announcements" style={{ color: 'var(--color-brand)', fontWeight: '600' }}>
                      Read →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="graphic-card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p className="muted" style={{ margin: 0 }}>No announcements yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* STUDENT COMMUNITY SECTION */}
      <section className="section" style={{ padding: '3rem 0' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-badge" style={{ color: 'var(--color-cyan)', background: 'var(--color-cyan-soft)' }}>👥 Peer Network</div>
            <h2>Student Community</h2>
            <p>Find people. Form groups. Study together.</p>
          </div>

          <div className="card-grid">
            <div className="graphic-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem' }}>👤</span>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Members</h3>
              <p className="muted" style={{ fontSize: '0.9rem', margin: 0 }}>
                Discover fellow students, check roll numbers, view profiles, and start direct conversations.
              </p>
              <Link to="/members" className="btn btn-secondary" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                Discover Students →
              </Link>
            </div>

            <div className="graphic-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem' }}>👥</span>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Study Groups</h3>
              <p className="muted" style={{ fontSize: '0.9rem', margin: 0 }}>
                Learn and collaborate together. Create study circles, ask questions, and share notes with group members.
              </p>
              <Link to="/groups" className="btn btn-secondary" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                Join Study Groups →
              </Link>
            </div>

            <div className="graphic-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem' }}>💬</span>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Conversations</h3>
              <p className="muted" style={{ fontSize: '0.9rem', margin: 0 }}>
                Direct 1-on-1 messaging and real-time group discussions with full message edit/delete features.
              </p>
              <Link to="/chat" className="btn btn-secondary" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                Open Chat →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CURRICULUM / SEMESTERS SECTION */}
      <section id="semesters" className="section" style={{ background: 'var(--color-surface-glass)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-badge">📚 Academic Curriculum</div>
            <h2>Browse by Semester</h2>
            <p>Pick a semester to explore subjects, lecture notes, slides, and question papers.</p>
          </div>

          {!isAuthenticated && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem', background: 'var(--color-brand-soft)', color: 'var(--color-brand)', border: '1px solid var(--color-border)' }}>
              Create an account or log in to view semester subjects and download materials.{' '}
              <Link to="/register" style={{ fontWeight: 600, textDecoration: 'underline' }}>Register</Link> ·{' '}
              <Link to="/login" style={{ fontWeight: 600, textDecoration: 'underline' }}>Login</Link>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card-grid">
            {semesters.map((semester) => (
              <SemesterCard key={semester.id} semester={semester} />
            ))}
          </div>

          {/* Message from Owner section */}
          <div className="graphic-card" style={{ marginTop: '2.5rem', background: 'var(--color-bg-card)', borderLeft: '4px solid var(--color-brand)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Platform Contribution & Updates</h3>
                <span className="muted" style={{ fontSize: '0.85rem' }}>Message from Owner</span>
              </div>
            </div>
            <p className="muted" style={{ fontSize: '0.92rem', margin: 0, lineHeight: '1.5' }}>
              Course materials get updated on a weekly basis. If you want to contribute study materials, notes, or slides, please visit the{' '}
              <Link to="/about" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>about section</Link> to get in touch.
            </p>
          </div>
        </div>
      </section>

      {/* FEEDBACK / THOUGHTS SECTION */}
      <section className="section" style={{ padding: '3.5rem 0' }}>
        <div className="container">
          <div className="graphic-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-brand-soft) 100%)', border: '1px solid var(--color-border)' }}>
            <h2>Leave your thoughts & feedback 💬</h2>
            <p className="muted" style={{ maxWidth: '36rem', margin: '0 auto 1.5rem' }}>
              We would love to hear your experience, suggestions, and feedback to make Fragy the best digital campus for everyone!
            </p>
            <Link to="/comments" className="btn btn-primary btn-lg">
              Share Your Thoughts
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
