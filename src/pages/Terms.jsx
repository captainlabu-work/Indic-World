import { useEffect } from 'react';
import './LegalPages.css';

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Indic ("the Platform"), you agree to be bound by these Terms of Service ("Terms").
            If you do not agree to these Terms, please do not use our Platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Description of Service</h2>
          <p>
            Indic is a storytelling platform that allows users to create, share, and discover written content.
            We provide tools for writers to publish their stories and for readers to engage with content.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. User Accounts</h2>
          <h3>3.1 Account Creation</h3>
          <ul>
            <li>You must provide accurate and complete information when creating an account</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must be at least 13 years old to use our Platform</li>
            <li>One person or entity may not maintain more than one account</li>
          </ul>

          <h3>3.2 Account Responsibilities</h3>
          <ul>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must notify us immediately of any unauthorized use of your account</li>
            <li>We are not liable for any loss or damage from your failure to maintain account security</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. User Content</h2>
          <h3>4.1 Content Ownership</h3>
          <p>
            You retain ownership of all content you create and publish on our Platform. By posting content, you grant us a
            non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute your content on our Platform.
          </p>

          <h3>4.2 Content Guidelines</h3>
          <p>You agree not to post content that:</p>
          <ul>
            <li>Violates any applicable laws or regulations</li>
            <li>Infringes on intellectual property rights of others</li>
            <li>Contains hate speech, harassment, or discrimination</li>
            <li>Includes explicit adult content without appropriate warnings</li>
            <li>Spreads misinformation or false information</li>
            <li>Promotes illegal activities or violence</li>
            <li>Contains spam or commercial solicitations</li>
          </ul>

          <h3>4.3 Content Moderation</h3>
          <p>
            We reserve the right to review, moderate, and remove content that violates these Terms.
            We may suspend or terminate accounts that repeatedly violate our content guidelines.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Intellectual Property Rights</h2>
          <p>
            The Platform and its original content, features, and functionality are owned by Indic and are protected by
            international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Prohibited Uses</h2>
          <p>You may not:</p>
          <ul>
            <li>Use the Platform for any illegal purpose or in violation of any laws</li>
            <li>Attempt to gain unauthorized access to our systems or networks</li>
            <li>Interfere with or disrupt the Platform's operation</li>
            <li>Use automated systems or software to extract data from the Platform</li>
            <li>Impersonate another person or entity</li>
            <li>Sell or transfer your account to another person</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Privacy</h2>
          <p>
            Your use of the Platform is also governed by our Privacy Policy. Please review our Privacy Policy,
            which also governs the Platform and informs users of our data collection practices.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Disclaimers</h2>
          <ul>
            <li>The Platform is provided "as is" without warranties of any kind</li>
            <li>We do not guarantee the accuracy, completeness, or usefulness of any content</li>
            <li>We are not responsible for user-generated content</li>
            <li>We do not guarantee uninterrupted or error-free operation of the Platform</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Indic shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use or inability to use the Platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Indic and its affiliates from any claims, damages, losses, liabilities,
            costs, and expenses arising from your violation of these Terms or your use of the Platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability,
            for any reason, including breach of these Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India,
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material,
            we will provide at least 30 days notice prior to any new terms taking effect.
          </p>
        </section>

        <section className="legal-section">
          <h2>14. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul>
            <li>Email: legal@indic.com</li>
            <li>Address: Indic Platform, India</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Terms;