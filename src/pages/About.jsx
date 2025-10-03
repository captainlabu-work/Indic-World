import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <header className="about-header">
        <div className="logo-section">
          <h1 className="logo-text">Indic</h1>
          <div className="divider"></div>
          <img src="/Indic 2.png" alt="Indic Logo" className="logo-img" />
        </div>
      </header>

      <main className="about-content">
        <p className="story-text">
          We are not just a platform for voices. We are one of the voices. Storytellers of what matters: poetic, raw, thoughtful, and bold. At Indic, we chase passion over perfection, the messy over the polished. We write, craft, nurture, narrate, and capture stories. In a world of facades, we are a place for authenticity. We believe in the indomitable human spirit. One that has survived eras of brutality, suppression, pain, and suffering, yet never stopped astonishing nature with its ingenuity to create art, songs, literature, cinema, and beyond. We are here for that ingenuity. We believe in that ingenuity. We strive for that enduring spirit, a spirit that transcends cultures and never stops creating meaning.
        </p>

        <div className="final-statement">
          <h2 className="final-text">We are Indic.</h2>
        </div>
      </main>
    </div>
  );
};

export default About;
