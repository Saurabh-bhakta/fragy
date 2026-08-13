import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import GlobalSearchModal from './GlobalSearchModal';

/**
 * FRAGY Redesigned Navbar — Digital Campus for Students
 * Features Study Dropdown, Community Dropdown, Global Search, Admin item, and Single Theme Toggle.
 */
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const studyRef = useRef(null);
  const communityRef = useRef(null);
  const profileRef = useRef(null);

  const closeAllMenus = () => {
    setMenuOpen(false);
    setStudyOpen(false);
    setCommunityOpen(false);
    setProfileOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (studyRef.current && !studyRef.current.contains(e.target)) setStudyOpen(false);
      if (communityRef.current && !communityRef.current.contains(e.target)) setCommunityOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand" onClick={closeAllMenus} aria-label="Fragy home">
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
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            Menu
          </button>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeAllMenus}>
              Home
            </NavLink>

            {/* STUDY DROPDOWN */}
            <div className="nav-dropdown" ref={studyRef}>
              <button
                type="button"
                className={`nav-link nav-dropdown-trigger ${studyOpen ? 'active' : ''}`}
                onClick={() => {
                  setStudyOpen((prev) => !prev);
                  setCommunityOpen(false);
                  setProfileOpen(false);
                }}
              >
                Study <span style={{ fontSize: '0.75rem' }}>▾</span>
              </button>

              {studyOpen && (
                <div className="nav-dropdown-menu">
                  <Link to="/#semesters" className="nav-dropdown-item" onClick={closeAllMenus}>
                    <span>📚</span> Semesters
                  </Link>
                  <Link to="/semester/1" className="nav-dropdown-item" onClick={closeAllMenus}>
                    <span>📖</span> Subjects & Material
                  </Link>
                  <Link to="/semester/1" className="nav-dropdown-item" onClick={closeAllMenus}>
                    <span>📄</span> Lecture Notes
                  </Link>
                  <Link to="/semester/1" className="nav-dropdown-item" onClick={closeAllMenus}>
                    <span>📊</span> Presentation Slides
                  </Link>
                  <Link to="/semester/1" className="nav-dropdown-item" onClick={closeAllMenus}>
                    <span>❓</span> PYQs & Question Bank
                  </Link>
                </div>
              )}
            </div>

            {/* COMMUNITY DROPDOWN */}
            {isAuthenticated && (
              <div className="nav-dropdown" ref={communityRef}>
                <button
                  type="button"
                  className={`nav-link nav-dropdown-trigger ${communityOpen ? 'active' : ''}`}
                  onClick={() => {
                    setCommunityOpen((prev) => !prev);
                    setStudyOpen(false);
                    setProfileOpen(false);
                  }}
                >
                  Community <span style={{ fontSize: '0.75rem' }}>▾</span>
                </button>

                {communityOpen && (
                  <div className="nav-dropdown-menu">
                    <Link to="/members" className="nav-dropdown-item" onClick={closeAllMenus}>
                      <span>👤</span> Members Directory
                    </Link>
                    <Link to="/groups" className="nav-dropdown-item" onClick={closeAllMenus}>
                      <span>👥</span> Study Groups
                    </Link>
                    <Link to="/groups" className="nav-dropdown-item" onClick={closeAllMenus}>
                      <span>🏢</span> My Groups
                    </Link>
                    <Link to="/chat" className="nav-dropdown-item" onClick={closeAllMenus}>
                      <span>💬</span> Chats & Messaging
                    </Link>
                  </div>
                )}
              </div>
            )}

            <NavLink to="/announcements" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeAllMenus}>
              Announcements
            </NavLink>

            {/* ADMIN LINK (ONLY IF ADMIN) */}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeAllMenus}>
                Admin
              </NavLink>
            )}

            {/* GLOBAL SEARCH TRIGGER */}
            <button
              type="button"
              className="nav-search-btn"
              onClick={() => {
                closeAllMenus();
                setSearchOpen(true);
              }}
              title="Search Fragy campus"
            >
              <span>⌕</span> Search Fragy...
            </button>

            {/* USER PROFILE / AUTH */}
            {isAuthenticated ? (
              <div className="nav-dropdown" ref={profileRef}>
                <button
                  type="button"
                  className={`nav-link nav-dropdown-trigger ${profileOpen ? 'active' : ''}`}
                  onClick={() => {
                    setProfileOpen((prev) => !prev);
                    setStudyOpen(false);
                    setCommunityOpen(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>👤</span>
                  )}
                  <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
                  <span style={{ fontSize: '0.75rem' }}>▾</span>
                </button>

                {profileOpen && (
                  <div className="nav-dropdown-menu" style={{ right: 0, left: 'auto' }}>
                    <Link to="/profile" className="nav-dropdown-item" onClick={closeAllMenus}>
                      <span>👤</span> My Profile
                    </Link>
                    <button
                      type="button"
                      className="nav-dropdown-item"
                      style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'var(--color-danger)' }}
                      onClick={() => {
                        closeAllMenus();
                        logout();
                        navigate('/login');
                      }}
                    >
                      <span>🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <NavLink to="/register" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeAllMenus}>
                  Register
                </NavLink>
                <NavLink to="/login" className="btn btn-primary" onClick={closeAllMenus} style={{ padding: '0.45rem 1rem', fontSize: '0.9rem' }}>
                  Login
                </NavLink>
              </>
            )}

            {/* SINGLE THEME TOGGLE */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </nav>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default Navbar;
