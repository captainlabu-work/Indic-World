import { useEffect } from 'react';
import './LegalPages.css';

const CookiePolicy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Cookie Policy</h1>
        <p className="legal-updated">Last updated: April 8, 2026</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. What Are Cookies</h2>
          <p>
            Cookies are small text files that websites store in your browser. They help the site remember
            things about your visit — like whether you're logged in or what preferences you've set.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. How We Use Cookies</h2>
          <p>Indic uses cookies for a few simple purposes:</p>
          <ul>
            <li><strong>Authentication</strong> — to keep you logged in as you navigate the platform</li>
            <li><strong>Session management</strong> — to maintain your current session</li>
            <li><strong>Preferences</strong> — to remember settings like dark mode</li>
            <li><strong>Analytics</strong> — to understand basic usage patterns (page views, interactions)</li>
          </ul>
          <p>We do not use cookies for advertising or tracking you across other websites.</p>
        </section>

        <section className="legal-section">
          <h2>3. Third-Party Cookies</h2>
          <p>Some cookies may come from third-party services we use:</p>
          <ul>
            <li><strong>Firebase / Google</strong> — for authentication and session management</li>
            <li><strong>Analytics tools</strong> — for understanding how the platform is used</li>
          </ul>
          <p>These services set their own cookies and have their own cookie policies.</p>
        </section>

        <section className="legal-section">
          <h2>4. Managing Cookies</h2>
          <p>
            You can control cookies through your browser settings. Most browsers let you block or delete
            cookies. However, disabling cookies may affect some features — for example, you may need to
            log in again each time you visit.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Updates</h2>
          <p>
            We may update this Cookie Policy as the platform evolves. Any changes will be reflected on
            this page with an updated date.
          </p>
        </section>

        <section className="legal-section">
          <h2>Questions?</h2>
          <p>
            If you have any questions about how we use cookies, reach out to us at{' '}
            <a href="mailto:Indicsocials@gmail.com">Indicsocials@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicy;
