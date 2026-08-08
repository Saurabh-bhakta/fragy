import { Link } from 'react-router-dom';

/**
 * Reusable card for a single semester.
 * Clicking navigates to /semester/:id
 */
function SemesterCard({ semester }) {
  return (
    <Link to={`/semester/${semester.number}`} className="semester-card fade-up">
      <span className="semester-card-number" aria-hidden="true">
        {semester.number}
      </span>
      <h3>{semester.name}</h3>
      <p className="muted">{semester.description}</p>
      <p className="muted">{semester.subjectCount} subjects</p>
    </Link>
  );
}

export default SemesterCard;
