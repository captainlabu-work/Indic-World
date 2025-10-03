import { useEffect } from 'react';
import './LegalPages.css';

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Indic ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <p>We collect personal information that you provide to us, including but not limited to:</p>
          <ul>
            <li>Name and email address when you create an account</li>
            <li>Profile information you choose to provide</li>
            <li>Content you create, upload, or share on our platform</li>
            <li>Communications you send to us</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you use our platform, we automatically collect certain information:</p>
          <ul>
            <li>Log and usage data (IP address, browser type, pages visited)</li>
            <li>Device information (device type, operating system, unique device identifiers)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for various purposes:</p>
          <ul>
            <li>To provide, maintain, and improve our services</li>
            <li>To authenticate users and ensure security</li>
            <li>To communicate with you about updates, announcements, and support</li>
            <li>To personalize your experience on our platform</li>
            <li>To analyze usage patterns and optimize performance</li>
            <li>To comply with legal obligations and enforce our terms</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Sharing Your Information</h2>
          <p>We do not sell, trade, or rent your personal information. We may share your information in the following situations:</p>
          <ul>
            <li>With your consent or at your direction</li>
            <li>To comply with legal obligations or respond to legal requests</li>
            <li>To protect our rights, privacy, safety, or property</li>
            <li>With service providers who assist us in operating our platform</li>
            <li>In connection with a merger, sale, or acquisition of our business</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information.
            However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Your Rights and Choices</h2>
          <p>You have certain rights regarding your personal information:</p>
          <ul>
            <li>Access and receive a copy of your personal information</li>
            <li>Update or correct inaccurate information</li>
            <li>Delete your account and personal information</li>
            <li>Object to or restrict certain processing of your information</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our platform and store certain information.
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Children's Privacy</h2>
          <p>
            Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and maintained on servers located outside of your jurisdiction.
            By using our platform, you consent to such transfers.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page
            and updating the "Last updated" date.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li>Email: privacy@indic.com</li>
            <li>Address: Indic Platform, India</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Privacy;