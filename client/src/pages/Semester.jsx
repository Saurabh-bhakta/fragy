import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SubjectCard from '../components/SubjectCard';
import { api } from '../services/api';

/**
 * Semester detail page — subjects load from the API (login required).
 */
function Semester() {
  const { semesterId } = useParams();
  const [semester, setSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .getSemester(semesterId)
      .then((data) => {
        if (cancelled) return;
        setSemester({
          id: data.semester._id || data.semester.id,
          number: data.semester.number,
          name: data.semester.name,
          description: data.semester.description,
        });
        setSubjects(
          (data.subjects || []).map((s) => ({
            id: s._id || s.id,
            name: s.name,
            code: s.code,
          }))
        );
        setNotFound(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) setNotFound(true);
        else setError(err.message || 'Could not load semester.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [semesterId]);

  if (loading) {
    return (
      <div className="page section">
        <div className="container">
          <p className="muted">Loading semester…</p>
        </div>
      </div>
    );
  }

  if (notFound || !semester) {
    return (
      <div className="page section">
        <div className="container">
          <h1>Semester not found</h1>
          <p className="muted">{error || 'That semester does not exist yet.'}</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container page-banner">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>{semester.name}</span>
        </nav>
        <h1>{semester.name}</h1>
        <p className="muted">{semester.description}</p>
      </div>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="container">
          <div className="section-header">
            <h2>Subjects</h2>
            <p>Select a subject to view notes, slides, and PYQs.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card-grid">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                semesterId={semester.number}
                subject={subject}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Semester;
