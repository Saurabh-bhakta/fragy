import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Floating "More Options" widget positioned immediately above "Have a doubt?".
 * Gives quick access to Members, Form a Group, My Groups, and Private Chat.
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
      desc: 'Browse student & community directory',
    },
    {
      to: '/groups/create',
      icon: '➕',
      label: 'Form a Group',
      desc: 'Create a study group or club',
    },
    {
      to: '/groups',
      icon: '🏢',
      label: 'My Groups',
      desc: 'View & manage your joined groups',
    },
    {
      to: '/chat',
      icon: '💬',
      label: 'Private Chat',
      desc: '1-to-1 direct messaging',
    },
  ];

  return (
    <div className="more-options-widget-container" ref={widgetRef}>
      {isOpen && (
        <div className="more-options-popover" role="dialog" aria-label="Community & Group Chat Menu">
          <div className="more-options-header">
            <div className="more-options-title-row">
              <span className="more-options-icon" aria-hidden="true">
                ⚡
              </span>
              <div>
                <h3>More Options</h3>
                <p className="more-options-subtitle">Community, Groups & Messaging</p>
              </div>
            </div>
            <button
              type="button"
              className="more-options-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <div className="more-options-list">
            {menuOptions.map((opt) => (
              <Link
                key={opt.to}
                to={opt.to}
                className="more-options-item"
                onClick={() => setIsOpen(false)}
              >
                <span className="more-options-item-icon" aria-hidden="true">
                  {opt.icon}
                </span>
                <div className="more-options-item-meta">
                  <strong className="more-options-item-label">{opt.label}</strong>
                  <span className="more-options-item-desc">{opt.desc}</span>
                </div>
                <span className="more-options-item-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className={`more-options-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="More Options"
      >
        <span className="more-options-btn-icon" aria-hidden="true">
          ⚡
        </span>
        <span className="more-options-btn-text">More Options</span>
      </button>
    </div>
  );
}

export default MoreOptionsWidget;
