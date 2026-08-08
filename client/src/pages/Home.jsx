import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import SemesterCard from '../components/SemesterCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { semesters as fallbackSemesters } from '../data/semesters';

/**
 * Landing page: hero + semester grid.
 * Guests can see semester cards, but opening one requires login.
 */
function Home() {
  const { isAuthenticated } = useAuth();
  const [semesters, setSemesters] = useState(fallbackSemesters);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    api
      .getSemesters()
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
          setError('Showing sample semesters — start the API server to load live data.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <Hero />

      <section id="semesters" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Browse by Semester</h2>
            <p>Pick a semester to explore subjects and study materials.</p>
          </div>

          {!isAuthenticated && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              Create an account or log in to view semester subjects and download materials.{' '}
              <Link to="/register">Register</Link> · <Link to="/login">Login</Link>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card-grid">
            {semesters.map((semester) => (
              <SemesterCard key={semester.id} semester={semester} />
            ))}
          </div>
        </div>
      </section>

      {/* Callout section for student thoughts & comments */}
      <section className="section" style={{ paddingTop: '0', paddingBottom: '3rem' }}>
        <div className="container">
          <div className="thoughts-banner">
            <h2>Please leave your beautiful thoughts</h2>
            <p className="muted">
              We would love to hear your feedback, suggestions, or experiences using Fragy!
            </p>
            <Link to="/comments" className="btn btn-primary">
              Share Your Thoughts 💬
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
