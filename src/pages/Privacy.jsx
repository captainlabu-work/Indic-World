import { useEffect } from 'react';
import './LegalPages.css';

const Privacy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: April 8, 2026</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Indic is a storytelling platform where people publish written stories, photo essays, and films.
            This policy explains how we handle your data — simply and honestly.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <p><strong>Account Information</strong></p>
          <p>When you sign up, we collect your name, email address, and profile details you choose to provide.</p>

          <p><strong>User Content</strong></p>
          <p>Stories, images, videos, captions, and any other content you publish on Indic.</p>

          <p><strong>Usage Data</strong></p>
          <p>Basic information like pages you visit, how you interact with the platform, and general usage patterns. This helps us understand how Indic is being used.</p>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To operate and maintain the platform</li>
            <li>To display and manage your published content</li>
            <li>To improve your experience on Indic</li>
            <li>To communicate with you when needed (account updates, support)</li>
          </ul>
          <p>We do not sell your data. We do not use your content for advertising.</p>
        </section>

        <section className="legal-section">
          <h2>4. Third-Party Services</h2>
          <p>
            We use trusted third-party services to help run the platform:
          </p>
          <ul>
            <li>Firebase — for authentication, database, and file storage</li>
            <li>Google — if you use Google Sign-In</li>
            <li>Basic analytics tools to understand usage patterns</li>
          </ul>
          <p>These services have their own privacy policies. We only share the minimum data needed for them to function.</p>
        </section>

        <section className="legal-section">
          <h2>5. Data Security</h2>
          <p>
            We take reasonable steps to protect your data, including secure connections and access controls.
            That said, no system is 100% secure — we're honest about that.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Your Content & Responsibility</h2>
          <ul>
            <li>You own the content you publish on Indic</li>
            <li>You are responsible for what you publish</li>
            <li>We may remove content that violates our community guidelines</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Your Rights</h2>
          <ul>
            <li>You can update your profile information at any time</li>
            <li>You can request deletion of your account and data</li>
            <li>You can contact us with any questions about your data</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this policy as Indic grows. When we do, we'll update the date at the top of this page.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, reach out to us at{' '}
            <a href="mailto:Indicsocials@gmail.com">Indicsocials@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
