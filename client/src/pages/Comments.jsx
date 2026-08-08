import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * Comments page — allows students to share their thoughts and feedback about Fragy.
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
      // Add newly created comment to the list top
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
                const initial = (comment.authorName || '?').charAt(0).toUpperCase();
                const dateStr = comment.createdAt
                  ? new Date(comment.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <article key={comment.id || comment._id} className="comment-card fade-up">
                    <div className="comment-header">
                      <div className="comment-author-avatar">{initial}</div>
                      <div className="comment-author-meta">
                        <strong className="comment-author-name">{comment.authorName}</strong>
                        {dateStr && <span className="comment-date">{dateStr}</span>}
                      </div>
                    </div>
                    <p className="comment-message">{comment.message}</p>
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
