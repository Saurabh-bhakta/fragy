import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchSearch = async () => {
      const combined = [];

      try {
        // 1. Announcements search
        const annData = await api.getAnnouncements().catch(() => ({ announcements: [] }));
        const matchedAnns = (annData.announcements || [])
          .filter(a => a.title?.toLowerCase().includes(q) || a.message?.toLowerCase().includes(q))
          .slice(0, 3)
          .map(a => ({
            type: 'Announcement',
            icon: '📢',
            title: a.title,
            subtitle: a.message?.substring(0, 60) + '...',
            link: '/announcements',
          }));
        combined.push(...matchedAnns);

        // 2. Semesters search
        const semData = await api.getSemesters().catch(() => ({ semesters: [] }));
        const matchedSems = (semData.semesters || [])
          .filter(s => s.name?.toLowerCase().includes(q) || `semester ${s.number}`.includes(q))
          .slice(0, 3)
          .map(s => ({
            type: 'Semester',
            icon: '📚',
            title: s.name,
            subtitle: `Semester ${s.number}`,
            link: `/semester/${s._id || s.number}`,
          }));
        combined.push(...matchedSems);

        if (isAuthenticated) {
          // 3. Groups search
          const groupData = await api.getGroups().catch(() => ({ groups: [] }));
          const matchedGroups = (groupData.groups || [])
            .filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
            .slice(0, 3)
            .map(g => ({
              type: 'Study Group',
              icon: '👥',
              title: g.name,
              subtitle: `${g.memberCount || 1} members`,
              link: `/groups/${g._id}`,
            }));
          combined.push(...matchedGroups);

          // 4. Members search
          const memData = await api.getMembers(q).catch(() => ({ users: [] }));
          const matchedMems = (memData.users || [])
            .slice(0, 3)
            .map(m => ({
              type: 'Student Member',
              icon: '👤',
              title: m.name,
              subtitle: m.rollNumber ? `Roll: ${m.rollNumber}` : m.email,
              link: `/profile/${m._id}`,
            }));
          combined.push(...matchedMems);
        }

        if (isMounted) {
          setResults(combined);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchSearch, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, isAuthenticated]);

  if (!isOpen) return null;

  const handleSelect = (link) => {
    onClose();
    navigate(link);
  };

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <span style={{ fontSize: '1.2rem', color: 'var(--color-brand)' }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search Fragy semesters, materials, announcements, groups..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
            onClick={onClose}
          >
            ESC
          </button>
        </div>

        <div className="search-modal-results">
          {loading && <div className="muted" style={{ padding: '1rem', textAlign: 'center' }}>Searching campus network...</div>}

          {!loading && query.trim() && results.length === 0 && (
            <div className="muted" style={{ padding: '1.5rem', textAlign: 'center' }}>
              No matching campus records found for "{query}".
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="muted" style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.9rem' }}>
              Type to search semesters, announcements, groups, and members.
            </div>
          )}

          {!loading && results.map((item, idx) => (
            <div
              key={idx}
              className="search-result-item"
              onClick={() => handleSelect(item.link)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{item.title}</strong>
                  <span className="section-badge" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', margin: 0 }}>
                    {item.type}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: '0.82rem' }}>{item.subtitle}</div>
              </div>
              <span className="muted" style={{ fontSize: '0.9rem' }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchModal;
