import { useState, useRef, useEffect } from 'react';

/**
 * Redesigned Floating "Have a doubt?" widget at bottom-right corner.
 * Compact default state (💬), expands gracefully on hover, opens AI model selector.
 */
export function DoubtWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [copiedMsg, setCopiedMsg] = useState('');
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

  const aiOptions = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      provider: 'OpenAI',
      icon: '🤖',
      color: '#10a37f',
      getUrl: (q) => (q ? `https://chatgpt.com/?q=${encodeURIComponent(q)}` : 'https://chatgpt.com'),
      desc: 'Great for step-by-step concepts, code & math',
    },
    {
      id: 'gemini',
      name: 'Gemini',
      provider: 'Google',
      icon: '✨',
      color: '#1a73e8',
      getUrl: (q) => `https://gemini.google.com/app`,
      desc: 'Fast multimodal study assistance & explanations',
    },
    {
      id: 'claude',
      name: 'Claude',
      provider: 'Anthropic',
      icon: '🧠',
      color: '#d97706',
      getUrl: (q) => `https://claude.ai`,
      desc: 'Deep analytical explanations & clear writing',
    },
  ];

  return (
    <div className="doubt-widget-container" ref={widgetRef}>
      {/* Popover Card */}
      {isOpen && (
        <div className="doubt-popover" role="dialog" aria-label="Have a doubt AI assistance" style={{
          position: 'absolute',
          bottom: '3.8rem',
          right: 0,
          width: '320px',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.25rem',
          zIndex: 200,
          animation: 'modalRise 180ms ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>💡</span>
              <div>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Have a doubt?</h3>
                <span className="muted" style={{ fontSize: '0.78rem' }}>Instant AI study assistance</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--color-ink-muted)' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label htmlFor="doubt-input" className="muted" style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Your Question (optional)
              </label>
              <input
                id="doubt-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Explain binary search trees..."
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-input-bg)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            {copiedMsg && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-green)', background: 'var(--color-green-soft)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                {copiedMsg}
              </div>
            )}

            <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select AI Model:</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {aiOptions.map((ai) => {
                const url = ai.getUrl(query.trim());
                return (
                  <a
                    key={ai.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (query.trim() && navigator.clipboard) {
                        navigator.clipboard.writeText(query.trim()).catch(() => {});
                        setCopiedMsg(`Query copied! Opening ${ai.name}...`);
                        setTimeout(() => setCopiedMsg(''), 2500);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      transition: 'all var(--transition)'
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{ai.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-ink)' }}>{ai.name}</div>
                      <div className="muted" style={{ fontSize: '0.76rem' }}>{ai.desc}</div>
                    </div>
                    <span className="muted" style={{ fontSize: '0.85rem' }}>↗</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* COMPACT FLOATING BUTTON (DEFAULT 💬, EXPANDS ON HOVER) */}
      <button
        type="button"
        className={`doubt-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Have a doubt? Ask AI"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1.1rem',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--color-brand) 0%, #7c3aed 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.2)',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(99, 102, 241, 0.4)',
          transition: 'all 250ms ease'
        }}
      >
        <span style={{ fontSize: '1.15rem' }}>💬</span>
        <span>Have a doubt?</span>
      </button>
    </div>
  );
}

export default DoubtWidget;
