import { Link } from 'react-router-dom';

/**
 * FRAGY Redesigned SemesterCard component.
 * Displays semester number, name, available subjects count, and Explore action.
 */
function SemesterCard({ semester }) {
  return (
    <Link to={`/semester/${semester.number}`} className="semester-card fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="section-badge" style={{ margin: 0 }}>
          Semester {semester.number}
        </span>
        <span className="muted" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
          {semester.subjectCount} {semester.subjectCount === 1 ? 'Subject' : 'Subjects'}
        </span>
      </div>

      <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--color-ink)' }}>{semester.name}</h3>
      <p className="muted" style={{ fontSize: '0.88rem', margin: 0, flex: 1, lineHeight: '1.5' }}>
        {semester.description || 'Core subjects, lecture notes, slides, and question papers.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-brand)', fontWeight: 700, fontSize: '0.92rem', marginTop: '0.5rem' }}>
        <span>Explore Subjects</span>
        <span>→</span>
      </div>
    </Link>
  );
}

export default SemesterCard;
