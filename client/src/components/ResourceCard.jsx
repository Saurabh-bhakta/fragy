/**
 * Displays a single study resource (notes / slides / PYQ).
 * Opens the resource/Drive URL in a new browser tab.
 */
function ResourceCard({ resource, onOpen }) {
  const handleButtonClick = (e) => {
    e.preventDefault();
    if (onOpen) {
      onOpen(resource);
    }
  };

  return (
    <article className="resource-card">
      <div className="resource-meta">
        <h3>{resource?.title}</h3>
        {resource?.description && <p className="muted">{resource.description}</p>}
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleButtonClick}
      >
        Open
      </button>
    </article>
  );
}

export default ResourceCard;
