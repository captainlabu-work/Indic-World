import { useEffect } from 'react';
import './LegalPages.css';

const Terms = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: April 8, 2026</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Indic is a storytelling platform where users publish written stories, photo essays, and films.
            By using Indic, you agree to these terms. If you do not agree, please do not use the platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. User Accounts</h2>
          <ul>
            <li>You are responsible for maintaining the security of your account</li>
            <li>The information you provide should be accurate and up to date</li>
            <li>You must keep your login credentials confidential</li>
            <li>You are responsible for all activity under your account</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. User Content</h2>
          <ul>
            <li>You retain ownership of the content you publish on Indic</li>
            <li>By publishing content, you grant Indic the right to display and distribute it on the platform</li>
            <li>You are solely responsible for the content you create and share</li>
            <li>You confirm that your content does not infringe on the rights of others</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Content Guidelines</h2>
          <p>The following types of content are not permitted on Indic:</p>
          <ul>
            <li>Illegal content of any kind</li>
            <li>Harmful, abusive, threatening, or hateful material</li>
            <li>Content that infringes copyright or intellectual property rights</li>
            <li>Misleading, fraudulent, or deliberately false content</li>
            <li>Spam, advertisements, or unsolicited promotions</li>
          </ul>
          <p>Indic reserves the right to remove any content that violates these guidelines.</p>
        </section>

        <section className="legal-section">
          <h2>5. Platform Rights</h2>
          <ul>
            <li>Indic may remove content that violates these terms or community guidelines</li>
            <li>Indic may suspend or terminate accounts that repeatedly violate these terms</li>
            <li>Indic may modify, update, or discontinue features of the platform at any time</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Intellectual Property</h2>
          <p>
            The Indic platform — including its design, branding, logo, and underlying technology — is the
            property of Indic. You may not copy, reproduce, or misuse any part of the platform without
            explicit permission.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Limitation of Liability</h2>
          <p>
            Indic is a hosting platform for user-generated content. We do not endorse, verify, or guarantee
            the accuracy or reliability of any content published by users. Use of the platform and engagement
            with user content is at your own risk.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Termination</h2>
          <ul>
            <li>You may stop using Indic at any time</li>
            <li>You may request deletion of your account and data</li>
            <li>Indic may suspend or terminate access if these terms are violated</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Changes to These Terms</h2>
          <p>
            We may update these Terms of Service as the platform evolves. Changes will be reflected on this
            page with an updated date. Continued use of Indic after changes constitutes acceptance.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Contact</h2>
          <p>
            If you have questions about these Terms, contact us at{' '}
            <a href="mailto:Indicsocials@gmail.com">Indicsocials@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
