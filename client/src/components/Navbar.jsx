import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Top navigation bar — auth-aware links for Profile / Login / Admin / Logout.
 */
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={closeMenu} aria-label="Fragy home">
          <span className="brand-mark" aria-hidden="true">
            F
          </span>
          Fragy
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
            Home
          </NavLink>
          <a href="/#semesters" className="nav-link" onClick={closeMenu}>
            Semesters
          </a>
          <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
            About
          </NavLink>
          <NavLink to="/comments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
            Comments
          </NavLink>

          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              Admin
            </NavLink>
          )}

          {isAuthenticated ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={closeMenu}
              >
                {user?.name?.split(' ')[0] || 'Profile'}
              </NavLink>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/register"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={closeMenu}
              >
                Register
              </NavLink>
              <NavLink to="/login" className="btn btn-primary" onClick={closeMenu}>
                Login
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
