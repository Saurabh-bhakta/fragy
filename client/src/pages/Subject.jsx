import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ResourceCard from '../components/ResourceCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  getResourcesForSubject,
  getSemesterById,
  getSubjectById,
} from '../data/semesters';

const RESOURCE_SECTIONS = [
  { key: 'notes', label: 'Notes', icon: '📄' },
  { key: 'slides', label: 'Slides', icon: '📊' },
  { key: 'pyqs', label: 'PYQs', icon: '❓' },
];

/**
 * Subject page with Notes / Slides / PYQs.
 * Directly opens driveUrl in a new tab when clicked.
 */
function Subject() {
  const { semesterId, subjectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const mockSubject = getSubjectById(semesterId, subjectId);
  const mockSemester = getSemesterById(semesterId);

  const [semester, setSemester] = useState(mockSemester);
  const [subject, setSubject] = useState(mockSubject);
  const [resources, setResources] = useState(() => getResourcesForSubject(subjectId));
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .getSubject(subjectId)
      .then((data) => {
        if (cancelled) return;
        setSubject({
          id: data.subject.id,
          name: data.subject.name,
          code: data.subject.code,
        });
        setSemester({
          number: data.subject.semesterNumber || Number(semesterId),
          name: data.subject.semesterName || `Semester ${semesterId}`,
        });
        setResources(data.resources);
        setNotFound(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404 && !mockSubject) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId, semesterId, mockSubject]);

  const handleOpenClick = (resource) => {
    setError('');

    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: `/semester/${semesterId}/subject/${subjectId}` },
      });
      return;
    }

    let targetUrl = resource.driveUrl || '';
    if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      setError('Resource URL is missing or invalid.');
    }
  };

  if (notFound || !subject) {
    return (
      <div className="page section">
        <div className="container">
          <h1>Subject not found</h1>
          <p className="muted">We could not find that subject in this semester.</p>
          <Link to={`/semester/${semesterId || 1}`} className="btn btn-primary">
            Back to Semester
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
          <Link to={`/semester/${semester?.number || semesterId}`}>
            {semester?.name || `Semester ${semesterId}`}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{subject.name}</span>
        </nav>
        <h1>{subject.name}</h1>
        <p className="muted">
          Notes, slides, and previous-year questions
        </p>
      </div>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="container resource-sections">
          {error && <div className="alert alert-error">{error}</div>}
          {loading && <p className="muted">Loading resources…</p>}

          {RESOURCE_SECTIONS.map((section) => {
            const items = resources[section.key] || [];

            return (
              <div key={section.key}>
                <h2>
                  <span aria-hidden="true">{section.icon}</span> {section.label}
                </h2>

                {items.length === 0 ? (
                  <div className="empty-state">
                    No {section.label.toLowerCase()} uploaded for this subject yet.
                  </div>
                ) : (
                  <div className="resource-list">
                    {items.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onOpen={handleOpenClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Subject;
