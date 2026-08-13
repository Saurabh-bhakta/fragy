import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * FRAGY Redesigned Hero Section — Digital Campus for Students
 */
function Hero() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Fetch real latest announcement
    api.getAnnouncements()
      .then((data) => {
        if (!cancelled && data.announcements?.length > 0) {
          setLatestAnnouncement(data.announcements[0]);
        }
      })
      .catch(() => {});

    // Fetch real active group if authenticated
    if (isAuthenticated) {
      api.getGroups()
        .then((data) => {
          if (!cancelled && data.groups?.length > 0) {
            setActiveGroup(data.groups[0]);
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-inner">
        <div className="hero-content">
          <div className="section-badge fade-up">
            <span>✨</span> Digital Campus Platform
          </div>

          <h1 id="hero-title" className="hero-title fade-up">
            YOUR CAMPUS.<br />
            YOUR KNOWLEDGE.<br />
            <span className="text-gradient">ONE PLACE.</span>
          </h1>

          <p className="hero-subtitle fade-up">
            Study smarter with organized course materials, student communities, announcements and collaborative learning.
          </p>

          <div className="hero-actions fade-up">
            <a
              href="#semesters"
              className="btn btn-primary btn-lg"
              onClick={(e) => {
                const el = document.getElementById('semesters');
                if (el) {
                  e.preventDefault();
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/semester/1');
                }
              }}
            >
              Explore Materials →
            </a>
            <Link to="/groups" className="btn btn-secondary btn-lg">
              Join Community →
            </Link>
          </div>
        </div>

        {/* HERO RIGHT-SIDE CONTENT — REAL LIVE DATA CARDS */}
        <div className="hero-card-stack fade-up">
          {/* CARD 1: Continue Learning */}
          <div className="graphic-card">
            <div className="graphic-card-badge">📚 Continue Learning</div>
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.2rem' }}>Digital Logic & Architecture</h3>
            <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.8rem' }}>Semester 1 · Core Computer Science</p>
            <Link to="/semester/1" className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
              Open Subject →
            </Link>
          </div>

          {/* CARD 2: Latest Announcement */}
          <div className="graphic-card">
            <div className="graphic-card-badge" style={{ color: 'var(--color-accent)' }}>📢 Latest Announcement</div>
            {latestAnnouncement ? (
              <>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.2rem' }}>{latestAnnouncement.title}</h3>
                <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.8rem' }}>
                  {latestAnnouncement.createdBy?.name || 'Admin'} · {new Date(latestAnnouncement.createdAt).toLocaleDateString()}
                </p>
                <Link to="/announcements" className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                  Read Announcement →
                </Link>
              </>
            ) : (
              <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                No active announcements yet. Check back soon!
              </p>
            )}
          </div>

          {/* CARD 3: Student Community */}
          <div className="graphic-card">
            <div className="graphic-card-badge" style={{ color: 'var(--color-cyan)' }}>👥 Student Community</div>
            {activeGroup ? (
              <>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.2rem' }}>{activeGroup.name}</h3>
                <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.8rem' }}>
                  {activeGroup.memberCount || 1} active members
                </p>
                <Link to={`/groups/${activeGroup._id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                  Open Group →
                </Link>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.2rem' }}>Collaborative Study Groups</h3>
                <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.8rem' }}>Form or join peer study groups</p>
                <Link to="/groups" className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                  Explore Groups →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
