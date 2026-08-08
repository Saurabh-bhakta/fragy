import { useState, useRef, useEffect } from 'react';

/**
 * Floating "Have a doubt?" widget at bottom-right corner.
 * Allows students to quickly ask their doubts using ChatGPT, Gemini, or Claude.
 */
export function DoubtWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [copiedMsg, setCopiedMsg] = useState('');
  const widgetRef = useRef(null);

  // Close widget when clicking outside or pressing Escape
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
      bgLight: '#e6f7f2',
      getUrl: (q) => (q ? `https://chatgpt.com/?q=${encodeURIComponent(q)}` : 'https://chatgpt.com'),
      desc: 'Great for step-by-step math, concepts & code',
    },
    {
      id: 'gemini',
      name: 'Gemini',
      provider: 'Google',
      icon: '✨',
      color: '#1a73e8',
      bgLight: '#e8f0fe',
      getUrl: (q) => `https://gemini.google.com/app`,
      desc: 'Fast responses, multimodal & study assistance',
    },
    {
      id: 'claude',
      name: 'Claude',
      provider: 'Anthropic',
      icon: '🧠',
      color: '#d97706',
      bgLight: '#fef3c7',
      getUrl: (q) => `https://claude.ai`,
      desc: 'Deep analytical explanations & clear writing',
    },
  ];

  const handleAiRedirect = (ai) => {
    if (query.trim()) {
      navigator.clipboard?.writeText(query.trim()).catch(() => {});
      setCopiedMsg(`Query copied! Opening ${ai.name}...`);
      setTimeout(() => setCopiedMsg(''), 3000);
    }
    const url = ai.getUrl(query.trim());
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="doubt-widget-container" ref={widgetRef}>
      {/* Popover Card */}
      {isOpen && (
        <div className="doubt-popover" role="dialog" aria-label="Have a doubt AI assistance">
          <div className="doubt-header">
            <div className="doubt-title-row">
              <span className="doubt-badge-icon" aria-hidden="true">
                💡
              </span>
              <div>
                <h3>Have a doubt?</h3>
                <p className="doubt-subtitle">Ask popular AI assistants for instant help</p>
              </div>
            </div>
            <button
              type="button"
              className="doubt-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close doubt widget"
            >
              ✕
            </button>
          </div>

          <div className="doubt-body">
            <div className="doubt-input-group">
              <label htmlFor="doubt-query-input">Your Question (optional)</label>
              <input
                id="doubt-query-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Explain Boolean algebra logic gates..."
                className="doubt-input"
              />
            </div>

            {copiedMsg && <div className="doubt-copied-toast">{copiedMsg}</div>}

            <p className="doubt-select-label">Select an AI to open & ask:</p>

            <div className="doubt-ai-list">
              {aiOptions.map((ai) => (
                <button
                  key={ai.id}
                  type="button"
                  className="doubt-ai-btn"
                  onClick={() => handleAiRedirect(ai)}
                  style={{ '--ai-color': ai.color, '--ai-bg': ai.bgLight }}
                >
                  <span className="doubt-ai-icon" aria-hidden="true">
                    {ai.icon}
                  </span>
                  <div className="doubt-ai-meta">
                    <div className="doubt-ai-name-row">
                      <strong className="doubt-ai-name">{ai.name}</strong>
                      <span className="doubt-ai-provider">{ai.provider}</span>
                    </div>
                    <span className="doubt-ai-desc">{ai.desc}</span>
                  </div>
                  <span className="doubt-ai-arrow" aria-hidden="true">
                    ↗
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        className={`doubt-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Have a doubt? Ask AI"
      >
        <span className="doubt-btn-icon" aria-hidden="true">
          💬
        </span>
        <span className="doubt-btn-text">Have a doubt?</span>
        <span className="doubt-pulse-dot" aria-hidden="true"></span>
      </button>
    </div>
  );
}

export default DoubtWidget;
