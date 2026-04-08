import { useEffect } from 'react';
import './LegalPages.css';

const HelpCenter = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Help Center</h1>
        <p className="legal-updated">Welcome to Indic. If you're new here or facing an issue, this guide will help you navigate the platform.</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>Getting Started</h2>
          <ul>
            <li>Create an account using email or Google login</li>
            <li>Log in to access your dashboard</li>
            <li>Click on "Write a Story" to begin creating content</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Creating Content</h2>
          <p>Indic supports three formats:</p>

          <h3>Indic Word (Written Stories)</h3>
          <ul>
            <li>Write articles, essays, or reports</li>
            <li>Use the editor to format your content</li>
            <li>Add images inline if needed</li>
          </ul>

          <h3>Indic Lens (Photo Essays)</h3>
          <ul>
            <li>Upload multiple images</li>
            <li>Add captions and structure your story visually</li>
          </ul>

          <h3>Indic Motion (Video / Film)</h3>
          <ul>
            <li>Upload or embed video-based content</li>
            <li>Add context or description to support your visuals</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Saving & Publishing</h2>
          <ul>
            <li>You can save your work as a draft anytime</li>
            <li>Drafts are available in your dashboard</li>
            <li>When ready, submit your story for review</li>
          </ul>
          <p>After submission:</p>
          <ul>
            <li>Your story will be reviewed by the editorial team</li>
            <li>Once approved, it will be published on the platform</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Dashboard & Profile</h2>
          <ul>
            <li>Access all your drafts and published work from the dashboard</li>
            <li>Edit or update your content anytime</li>
            <li>Manage your profile information from Settings</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Common Issues</h2>

          <h3>My story didn't appear after submitting</h3>
          <ul>
            <li>Make sure it was successfully submitted (check your dashboard)</li>
            <li>If not visible, try refreshing or checking again after some time</li>
          </ul>

          <h3>Images are not uploading properly</h3>
          <ul>
            <li>Ensure you have a stable internet connection</li>
            <li>Try uploading again or reducing the image file size</li>
          </ul>

          <h3>I didn't get confirmation after saving or submitting</h3>
          <ul>
            <li>Check your dashboard to confirm the story status</li>
            <li>If still unsure, try saving again</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Guidelines</h2>
          <p>Before publishing, make sure your content follows:</p>
          <ul>
            <li>Community Guidelines</li>
            <li>Terms of Service</li>
          </ul>
          <p>Content that violates guidelines may be removed.</p>
        </section>

        <section className="legal-section">
          <h2>Need More Help?</h2>
          <p>
            If you're still facing issues, reach out to us at{' '}
            <a href="mailto:Indicsocials@gmail.com">Indicsocials@gmail.com</a>
          </p>
          <p style={{ marginTop: '1.5rem', fontStyle: 'italic', color: '#888' }}>
            Keep creating. That's what Indic is built for.
          </p>
        </section>
      </div>
    </div>
  );
};

export default HelpCenter;
