/**
 * Displays a single study resource (notes / slides / PYQ).
 * Opening the Drive link will later require auth + confirmation modal.
 */
function ResourceCard({ resource, onOpen }) {
  return (
    <article className="resource-card">
      <div className="resource-meta">
        <h3>{resource.title}</h3>
        {resource.description && <p className="muted">{resource.description}</p>}
      </div>
      <button type="button" className="btn btn-secondary" onClick={() => onOpen?.(resource)}>
        Open
      </button>
    </article>
  );
}

export default ResourceCard;
