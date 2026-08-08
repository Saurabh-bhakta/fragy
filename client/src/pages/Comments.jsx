import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * Comments page — allows students to share their thoughts and feedback about Fragy.
 * Users can edit their own comment within 5 minutes of posting.
 */
export function Comments() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [now, setNow] = useState(Date.now());

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await api.getComments();
      setComments(data.comments || []);
    } catch (err) {
      setError(err.message || 'Could not load comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // Update `now` timestamp every 10s to keep 5-minute countdown timers accurate
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!message.trim() || message.trim().length < 2) {
      setError('Please write at least 2 characters.');
      return;
    }
    if (message.trim().length > 500) {
      setError('Comments must be under 500 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.postComment(message.trim());
      setSuccess('Thank you! Your thought has been posted.');
      setMessage('');
      if (res.comment) {
        setComments((prev) => [res.comment, ...prev]);
      } else {
        fetchComments();
      }
    } catch (err) {
      setError(err.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment.id || comment._id);
    setEditText(comment.message);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditError('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim() || editText.trim().length < 2) {
      setEditError('Comment must be at least 2 characters.');
      return;
    }
    if (editText.trim().length > 500) {
      setEditError('Comment must be under 500 characters.');
      return;
    }

    setEditSubmitting(true);
    setEditError('');
    try {
      const res = await api.updateComment(commentId, editText.trim());
      setComments((prev) =>
        prev.map((c) => ((c.id || c._id) === commentId ? { ...c, ...res.comment } : c))
      );
      setEditingId(null);
      setSuccess('Comment updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setEditError(err.message || 'Failed to update comment.');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="page section">
      <div className="container" style={{ maxWidth: 840 }}>
        <div className="page-banner" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Student Thoughts & Feedback</h1>
          <p className="muted">
            Tell us what you think about Fragy! Share your feedback, suggestions, or words of encouragement.
          </p>
        </div>

        {/* Post Comment Section */}
        <div className="form-card" style={{ maxWidth: '100%', marginBottom: '2.5rem' }}>
          <h2>Share Your Thought</h2>

          {isAuthenticated ? (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <div className="form-group">
                <label htmlFor="comment-text">Posting as <strong>{user?.name}</strong></label>
                <textarea
                  id="comment-text"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What do you think about Fragy? Share your experience, notes suggestions, or ideas..."
                  maxLength={500}
                  required
                  className="comment-textarea"
                />
                <div className="comment-char-counter">
                  <span>{message.length} / 500 characters</span>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !message.trim()}
                >
                  {submitting ? 'Posting…' : 'Post Thought'}
                </button>
              </div>
            </form>
          ) : (
            <div className="comment-auth-notice">
              <p className="muted">
                Log in or register an account to leave a comment and share your feedback.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-secondary">
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Comments Feed */}
        <div className="comments-feed">
          <div className="comments-feed-header">
            <h2>Recent Thoughts ({comments.length})</h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={fetchComments}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <p className="muted" style={{ textAlign: 'center', padding: '2rem 0' }}>
              Loading thoughts…
            </p>
          ) : comments.length === 0 ? (
            <div className="empty-state">
              <p>No thoughts posted yet. Be the first student to share what you think!</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => {
                const commentId = comment.id || comment._id;
                const initial = (comment.authorName || '?').charAt(0).toUpperCase();
                const dateStr = comment.createdAt
                  ? new Date(comment.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';

                // Calculate 5-minute edit window availability
                const FIVE_MINS = 5 * 60 * 1000;
                const isOwner =
                  user &&
                  (String(comment.userId) === String(user.id) ||
                    String(comment.userId) === String(user._id));
                const createdAtMs = comment.createdAt ? new Date(comment.createdAt).getTime() : 0;
                const timePassed = now - createdAtMs;
                const canEdit = isOwner && timePassed < FIVE_MINS;
                const remainingMs = Math.max(0, FIVE_MINS - timePassed);
                const minsLeft = Math.floor(remainingMs / (60 * 1000));
                const secsLeft = Math.floor((remainingMs % (60 * 1000)) / 1000);

                const isEditingThis = editingId === commentId;

                return (
                  <article key={commentId} className="comment-card fade-up">
                    <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="comment-author-avatar">{initial}</div>
                        <div className="comment-author-meta">
                          <strong className="comment-author-name">{comment.authorName}</strong>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {dateStr && <span className="comment-date">{dateStr}</span>}
                            {comment.isEdited && <span className="muted" style={{ fontSize: '0.8rem' }}>(edited)</span>}
                          </div>
                        </div>
                      </div>

                      {/* Show edit button if current user created comment within 5 mins */}
                      {canEdit && !isEditingThis && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.82rem', padding: '0.25rem 0.6rem' }}
                          onClick={() => handleStartEdit(comment)}
                          title={`Can edit for ${minsLeft}m ${secsLeft}s`}
                        >
                          ✏️ Edit ({minsLeft}m {secsLeft}s left)
                        </button>
                      )}
                    </div>

                    {isEditingThis ? (
                      <div className="comment-edit-box" style={{ marginTop: '0.85rem' }}>
                        {editError && <div className="alert alert-error">{editError}</div>}
                        <textarea
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          maxLength={500}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={editSubmitting || !editText.trim()}
                            onClick={() => handleSaveEdit(commentId)}
                          >
                            {editSubmitting ? 'Saving…' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleCancelEdit}
                            disabled={editSubmitting}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="comment-message">{comment.message}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Comments;
