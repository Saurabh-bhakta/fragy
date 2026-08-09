import { Link } from 'react-router-dom';

/**
 * Modern educational Hero section with clean layout.
 */
function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-background" aria-hidden="true">
        <div className="hero-glow glow-1" />
        <div className="hero-glow glow-2" />
        <div className="hero-grid-pattern" />
      </div>

      <div className="container hero-inner">
        <div className="hero-content">
          <div className="hero-badge fade-up">
            <span className="badge-dot" />
            <span>Smart Learning Platform</span>
          </div>

          <h1 id="hero-title" className="hero-title fade-up">
            Your Study Materials, <br />
            <span className="text-gradient">All in One Place</span>
          </h1>

          <p className="hero-description fade-up">
            Access curated semester-wise lecture notes, presentation slides, and past exam questions organized to maximize your academic performance.
          </p>

          <div className="hero-actions fade-up">
            <a
              href="#semesters"
              className="btn btn-primary btn-lg"
              onClick={(e) => {
                const el = document.getElementById('semesters');
                if (el) {
                  e.preventDefault();
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Browse Semesters ↓
            </a>
            <Link to="/about" className="btn btn-secondary btn-lg">
              Learn About Fragy →
            </Link>
          </div>
        </div>

        <div className="hero-graphic-wrap fade-up" aria-hidden="true">
          <div className="hero-card-stack">
            <div className="graphic-card card-notes">
              <div className="card-header">
                <span className="icon">📄</span>
                <div>
                  <strong>Lecture Notes</strong>
                  <small>Unit-wise Summaries</small>
                </div>
              </div>
              <div className="card-lines">
                <div className="line line-full" />
                <div className="line line-half" />
              </div>
            </div>

            <div className="graphic-card card-slides">
              <div className="card-header">
                <span className="icon">📊</span>
                <div>
                  <strong>Presentation Slides</strong>
                  <small>Visual Guides</small>
                </div>
              </div>
            </div>

            <div className="graphic-card card-pyqs">
              <div className="card-header">
                <span className="icon">❓</span>
                <div>
                  <strong>Past Exam Papers</strong>
                  <small>Question Bank</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
