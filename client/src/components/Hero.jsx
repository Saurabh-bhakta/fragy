import { Link } from 'react-router-dom';

/**
 * Full-bleed landing hero.
 * Brand is the strongest visual signal; one headline, one line of copy, one CTA.
 */
function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-brand">
      <div className="hero-media" aria-hidden="true" />
      <div className="hero-content">
        <p id="hero-brand" className="hero-brand">
          Fragy
        </p>
        <h1 className="hero-heading">Your Study Materials, All in One Place</h1>
        <p className="hero-text">
          Browse semester-wise notes, slides, and previous-year questions curated for focused revision.
        </p>
        <Link to="/#semesters" className="btn btn-primary" onClick={(e) => {
          // Smooth-scroll to semester section when already on the home page
          const el = document.getElementById('semesters');
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}>
          Browse Semesters
        </Link>
      </div>
    </section>
  );
}

export default Hero;
