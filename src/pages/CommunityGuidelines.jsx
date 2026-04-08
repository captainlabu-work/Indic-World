import { useEffect } from 'react';
import './LegalPages.css';

const CommunityGuidelines = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="legal-container">
      <div className="legal-header">
        <h1>Community Guidelines</h1>
        <p className="legal-updated">Indic is built for thoughtful storytelling. To keep the platform meaningful and respectful, please follow these guidelines.</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Be Honest</h2>
          <ul>
            <li>Share original work or properly credit your sources</li>
            <li>Do not publish misleading or deliberately false information</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>2. Respect Others</h2>
          <ul>
            <li>No hate speech, harassment, or abusive behavior</li>
            <li>Respect different perspectives and voices</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. No Harmful Content</h2>
          <ul>
            <li>Do not post illegal, violent, or harmful material</li>
            <li>Avoid content that promotes harm or exploitation</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Respect Copyright</h2>
          <ul>
            <li>Only publish content you own or have permission to use</li>
            <li>Do not upload copyrighted material without proper rights</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Keep It Meaningful</h2>
          <ul>
            <li>Indic is for storytelling — avoid spam or low-effort content</li>
            <li>Focus on clarity, depth, and intent</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Platform Rights</h2>
          <ul>
            <li>Indic may remove content that violates these guidelines</li>
            <li>Repeated violations may lead to account suspension</li>
          </ul>
        </section>

        <section className="legal-section">
          <p style={{ fontStyle: 'italic', color: '#888', marginTop: '1rem' }}>
            Indic is a space for expression, not noise. Create with intent.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
