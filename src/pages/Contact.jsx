import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      // Save to Firebase instead of Netlify
      await addDoc(collection(db, 'contact_submissions'), {
        ...formData,
        timestamp: serverTimestamp(),
        status: 'unread'
      });

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <header className="contact-header">
        <h1>Get in Touch</h1>
        <p className="subtitle">We'd love to hear from you about creative collaborations or work opportunities</p>
      </header>

      <div className="contact-form">
        <div className="indie-decoration"></div>

        {!submitted && !error && (
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Your email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Tell us about your query or project idea..."
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}

        {submitted && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Thank you for reaching out!</h3>
            <p>We've received your message and will get back to you soon.</p>
            <button onClick={() => setSubmitted(false)} className="submit-btn">Send Another Message</button>
          </div>
        )}

        {error && (
          <div className="error-message">
            <h3>Something went wrong</h3>
            <p>Please try submitting the form again or contact us directly at workvishalthakur@gmail.com</p>
            <button onClick={() => setError(false)} className="submit-btn">Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
