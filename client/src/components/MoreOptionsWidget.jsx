import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Redesigned Floating "More Options" widget positioned immediately above "Have a doubt?".
 * Uses a compact floating circular button (⚡) opening a clean community navigation popover.
 */
export function MoreOptionsWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const menuOptions = [
    {
      to: '/members',
      icon: '👥',
      label: 'Members',
      desc: 'Browse student directory',
    },
    {
      to: '/groups/create',
      icon: '➕',
      label: 'Form a Group',
      desc: 'Create a study group',
    },
    {
      to: '/groups',
      icon: '🏢',
      label: 'My Groups',
      desc: 'View & manage joined groups',
    },
    {
      to: '/chat',
      icon: '💬',
      label: 'Direct Messaging',
      desc: '1-to-1 student chat',
    },
  ];

  return (
    <div className="more-options-widget-container" ref={widgetRef}>
      {isOpen && (
        <div
          role="dialog"
          aria-label="Community & Group Chat Menu"
          style={{
            position: 'absolute',
            bottom: '3.6rem',
            right: 0,
            width: '270px',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            padding: '1rem',
            zIndex: 200,
            animation: 'modalRise 180ms ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.1rem', color: 'var(--color-cyan)' }}>⚡</span>
              <strong style={{ fontSize: '0.95rem' }}>Quick Actions</strong>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {menuOptions.map((opt) => (
              <Link
                key={opt.to}
                to={opt.to}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.7rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--transition)',
                  color: 'var(--color-ink)'
                }}
                className="more-options-item"
              >
                <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{opt.label}</div>
                  <div className="muted" style={{ fontSize: '0.75rem' }}>{opt.desc}</div>
                </div>
                <span className="muted" style={{ fontSize: '0.8rem' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* COMPACT FLOATING CIRCULAR BUTTON */}
      <button
        type="button"
        className="compact-floating-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="More Options"
        title="More Options & Community Actions"
      >
        <span>⚡</span>
      </button>
    </div>
  );
}

export default MoreOptionsWidget;
