import { Link } from 'react-router-dom';

/**
 * Reusable card for a subject within a semester.
 */
function SubjectCard({ semesterId, subject }) {
  return (
    <Link
      to={`/semester/${semesterId}/subject/${subject.id}`}
      className="subject-card fade-up"
    >
      <p className="muted">{subject.code}</p>
      <h3>{subject.name}</h3>
      <p className="muted">Notes · Slides · PYQs</p>
    </Link>
  );
}

export default SubjectCard;
