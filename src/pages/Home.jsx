import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="main-logo">
          <h1 className="main-logo-text">Indic</h1>
          <div className="main-divider"></div>
          <img src="/Indic 2.png" alt="Indic Logo" className="main-logo-img" />
        </div>
        <p className="tagline">Storytellers of what matters: poetic, raw, thoughtful, and bold</p>
      </section>

      <section className="construction-message">
        <p className="construction-text main">We're crafting something extraordinary</p>
        <p className="construction-text">
          At Indic, we chase passion over perfection, the messy over the polished. We're building a platform where authenticity thrives and stories that matter find their voice.
        </p>
        <p className="construction-text">Stay tuned as we prepare to launch our space for genuine storytelling.</p>
      </section>

      <div className="cta-buttons">
        <Link to="/auth" className="cta-button">Get Started</Link>
      </div>
    </div>
  );
};

export default Home;
