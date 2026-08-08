/**
 * Confirmation modal before opening educational materials.
 */
function AccessModal({ open, title, notice, onCancel, onContinue, loading }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="access-modal-title">Before continuing</h2>
        {title && <p className="muted">Opening: {title}</p>}
        <p>
          {notice ||
            'These materials are provided for educational purposes. Please respect the effort of the creator and do not redistribute them without permission.'}
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onContinue} disabled={loading}>
            {loading ? 'Opening…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccessModal;
