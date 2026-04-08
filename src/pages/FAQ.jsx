import { useEffect } from 'react';
import './LegalPages.css';

const FAQ = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Frequently Asked Questions</h1>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>What is Indic?</h2>
          <p>Indic is a storytelling platform where you can publish written stories, photo essays, and video-based work.</p>
        </section>

        <section className="legal-section">
          <h2>Is Indic free to use?</h2>
          <p>Yes. Creating and publishing content on Indic is completely free.</p>
        </section>

        <section className="legal-section">
          <h2>What kind of content can I publish?</h2>
          <ul>
            <li>Written stories — Indic Word</li>
            <li>Photo essays — Indic Lens</li>
            <li>Video or film-based work — Indic Motion</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Do I own the content I publish?</h2>
          <p>Yes. You retain full ownership of your content. By publishing on Indic, you allow it to be displayed on the platform.</p>
        </section>

        <section className="legal-section">
          <h2>Why is my story not visible after submission?</h2>
          <p>Your story may be under review. If it still doesn't appear after some time, check your dashboard or try refreshing the page.</p>
        </section>

        <section className="legal-section">
          <h2>Can I edit my story after publishing?</h2>
          <p>Yes. You can update your content anytime from your dashboard.</p>
        </section>

        <section className="legal-section">
          <h2>What happens if my content violates guidelines?</h2>
          <p>Content that violates our Community Guidelines may be removed. Repeated violations may lead to account restrictions.</p>
        </section>

        <section className="legal-section">
          <h2>How do I contact support?</h2>
          <p>
            Reach out to us at{' '}
            <a href="mailto:Indicsocials@gmail.com">Indicsocials@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default FAQ;
