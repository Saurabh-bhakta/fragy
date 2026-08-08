import { useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * About page — intro plus owner & content provider details from the database.
 * Admins edit these fields from the Admin panel.
 */
function About() {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getAbout()
      .then((data) => {
        if (!cancelled) setAbout(data.about);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load about details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1>About Fragy</h1>

        {loading && <p className="muted">Loading…</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {about && (
          <>
            <p style={{ whiteSpace: 'pre-wrap' }}>{about.aboutIntro}</p>
            <p className="muted">
              Materials are shared for educational purposes. Please respect creators and do not
              redistribute content without permission.
            </p>

            <div className="about-grid">
              <PersonCard title="Owner details" person={about.owner} />
              <PersonCard title="Content provider details" person={about.contentProvider} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PersonCard({ title, person }) {
  if (!person) return null;

  return (
    <section className="about-person-card">
      <h2>{title}</h2>
      <h3>{person.name || '—'}</h3>
      {person.role && <p className="muted">{person.role}</p>}
      {person.bio && <p style={{ whiteSpace: 'pre-wrap' }}>{person.bio}</p>}

      <ul className="about-contact-list">
        {person.email && (
          <li>
            <strong>Email:</strong>{' '}
            <a href={`mailto:${person.email}`}>{person.email}</a>
          </li>
        )}
        {person.phone && (
          <li>
            <strong>Phone:</strong> {person.phone}
          </li>
        )}
        {person.links && (
          <li>
            <strong>Links:</strong>{' '}
            {looksLikeUrl(person.links) ? (
              <a href={person.links} target="_blank" rel="noopener noreferrer">
                {person.links}
              </a>
            ) : (
              person.links
            )}
          </li>
        )}
      </ul>
    </section>
  );
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export default About;
