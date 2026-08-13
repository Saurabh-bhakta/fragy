/**
 * FRAGY Redesigned ResourceCard component.
 * Displays a single study resource (notes / slides / PYQ) with icon, title, description, and Open button.
 * Opens the resource/Drive URL in a new browser tab.
 */
function ResourceCard({ resource, onOpen }) {
  const handleButtonClick = (e) => {
    e.preventDefault();
    if (onOpen) {
      onOpen(resource);
    }
  };

  const getIcon = () => {
    const type = (resource?.type || '').toLowerCase();
    if (type.includes('note')) return '📄';
    if (type.includes('slide') || type.includes('presentation')) return '📊';
    if (type.includes('pyq') || type.includes('paper') || type.includes('question')) return '❓';
    return '📚';
  };

  return (
    <article className="resource-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        <span style={{ fontSize: '1.5rem', background: 'var(--color-brand-soft)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
          {getIcon()}
        </span>
        <div>
          <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.2rem', color: 'var(--color-ink)' }}>{resource?.title}</h3>
          <p className="muted" style={{ fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>
            {resource?.description || 'Curated study material for this subject.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleButtonClick}
        style={{ padding: '0.45rem 1.1rem', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
      >
        Open ↗
      </button>
    </article>
  );
}

export default ResourceCard;
