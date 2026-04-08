import { useEffect } from 'react';
import './LegalPages.css';

const Disclaimer = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Disclaimer</h1>
        <p className="legal-updated">Last updated: April 8, 2026</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. General Disclaimer</h2>
          <p>
            Content published on Indic is created by its users. The views, opinions, and information
            expressed in stories, photo essays, and films belong solely to the authors — not to Indic
            as a platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. No Professional Advice</h2>
          <p>
            Content on Indic should not be treated as legal, financial, medical, or any other form of
            professional advice. Always consult qualified professionals for specific guidance.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Accuracy of Content</h2>
          <p>
            While we encourage honest and thoughtful storytelling, we do not guarantee the accuracy,
            completeness, or reliability of any content published on the platform. Users should exercise
            their own judgment when engaging with published content.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. External Links</h2>
          <p>
            Stories on Indic may contain links to third-party websites. We are not responsible for the
            content, accuracy, or practices of external sites. Following external links is at your own discretion.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Use at Your Own Risk</h2>
          <p>
            You engage with content on Indic at your own risk. Indic is not liable for any loss, damage,
            or harm that may result from using the platform or acting on information found here.
          </p>
        </section>

        <section className="legal-section">
          <h2>Questions?</h2>
          <p>
            If you have concerns about any content on the platform, contact us at{' '}
            <a href="mailto:Indicsocials@gmail.com">Indicsocials@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Disclaimer;
