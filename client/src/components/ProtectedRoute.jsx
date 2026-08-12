import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps pages that require a logged-in user and complete profile.
 * Redirects to /login if unauthenticated.
 * Redirects to /complete-profile if profile is incomplete (unless admin).
 */
function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin, isProfileComplete } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page section">
        <div className="container">
          <p className="muted">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Enforce mandatory profile completion for non-admins
  if (!isAdmin && !isProfileComplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
