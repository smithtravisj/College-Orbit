'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Handshake, Gift, Link2, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';

const partnerTypes = [
  {
    icon: Sparkles,
    title: 'Tutors & Academic Coaches',
    description: 'Help your students stay organized with premium access codes they can use alongside your sessions.',
  },
  {
    icon: Link2,
    title: 'Content Creators',
    description: 'Share a referral link with your audience. They get premium free, you help them succeed.',
  },
  {
    icon: Handshake,
    title: 'Organization Leaders',
    description: 'Running a study group, honor society, or student org? Get bulk codes for your members.',
  },
];

const benefits = [
  'Free premium codes for your audience',
  'Optional referral link for tracking',
  'No calls or meetings required',
  'We handle everything after you share once',
];

export default function PartnersPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    audience: '',
    website: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/partner-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partner',
          email: form.email,
          name: form.name,
          role: form.role,
          audienceSize: form.audience,
          website: form.website,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="partners-page">
      <style>{`
        .partners-page {
          min-height: 100vh;
          background: #0a0e13;
          position: relative;
          overflow-x: hidden;
        }

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .bg-orb-1 {
          width: 600px;
          height: 600px;
          top: -200px;
          left: -100px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
        }

        .bg-orb-2 {
          width: 500px;
          height: 500px;
          bottom: 20%;
          right: -150px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.10) 0%, transparent 70%);
        }

        .page-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 24px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #e2e8f0;
        }

        .site-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .site-name {
          font-size: 22px;
          font-weight: 600;
          color: #e2e8f0;
          letter-spacing: -0.01em;
        }

        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 40px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 700px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 18px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
          color: #a5b4fc;
          margin-bottom: 28px;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '12px'});
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .hero-title {
          font-size: clamp(32px, 6vw, 52px);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 20px;
          color: #f0f4f8;
          letter-spacing: -0.02em;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '20px'});
          transition: opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s;
        }

        .hero-title span {
          background: linear-gradient(135deg, #a5b4fc 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: clamp(16px, 2.5vw, 20px);
          color: #94a3b8;
          max-width: 550px;
          margin: 0 auto;
          line-height: 1.65;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '20px'});
          transition: opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s;
        }

        .content-section {
          padding: 40px 24px 80px;
          position: relative;
          z-index: 1;
        }

        .content-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .partner-types-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 60px;
        }

        .partner-type-card {
          padding: 28px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .partner-type-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .partner-type-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          margin-bottom: 18px;
          color: #a5b4fc;
        }

        .partner-type-title {
          font-size: 17px;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 10px;
        }

        .partner-type-description {
          font-size: 14px;
          color: #7a8a9b;
          line-height: 1.6;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          align-items: start;
        }

        .benefits-section {
          padding: 32px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 20px;
        }

        .benefits-title {
          font-size: 20px;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 24px;
        }

        .benefits-list {
          list-style: none;
          padding: 0;
          margin: 0 0 28px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          color: #e2e8f0;
        }

        .benefit-check {
          color: #22c55e;
          flex-shrink: 0;
        }

        .no-call-note {
          padding: 16px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
        }

        .no-call-text {
          font-size: 14px;
          color: #86efac;
          font-weight: 500;
        }

        .form-section {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
        }

        .form-title {
          font-size: 20px;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #e2e8f0;
          margin-bottom: 8px;
        }

        .form-label span {
          color: #ef4444;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 12px 16px;
          background-color: #0f1114 !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 15px;
          color: #e2e8f0;
          transition: all 0.2s ease;
        }

        .form-input::placeholder {
          color: #707070;
        }

        .form-input:-webkit-autofill,
        .form-input:-webkit-autofill:hover,
        .form-input:-webkit-autofill:focus,
        .form-select:-webkit-autofill,
        .form-select:-webkit-autofill:hover,
        .form-select:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0f1114 inset !important;
          -webkit-text-fill-color: #e2e8f0 !important;
          background-color: #0f1114 !important;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23707070' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 40px;
        }

        .form-select option {
          background: #0f1114;
          color: #707070;
        }

        .form-helper {
          font-size: 12px;
          color: #707070;
          margin-top: 6px;
        }

        .submit-btn {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99, 102, 241, 0.45);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .success-message {
          text-align: center;
          padding: 40px 20px;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(34, 197, 94, 0.15);
          border-radius: 50%;
          margin: 0 auto 20px;
          color: #22c55e;
        }

        .success-title {
          font-size: 22px;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 12px;
        }

        .success-text {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .footer-section {
          padding: 48px 24px 32px;
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-content {
          max-width: 500px;
          margin: 0 auto;
        }

        .footer-columns {
          display: flex;
          justify-content: center;
          gap: 80px;
          margin-bottom: 32px;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-column-title {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .footer-link {
          font-size: 14px;
          color: #707070;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #e2e8f0;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-contact {
          margin-bottom: 12px;
        }

        .footer-contact-email {
          font-size: 14px;
          color: #a5b4fc;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .footer-contact-email:hover {
          color: #c4b5fd;
        }

        .footer-copyright {
          font-size: 12px;
          color: #475569;
        }

        @media (max-width: 768px) {
          .partner-types-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .main-content {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .page-header {
            padding: 16px;
          }

          .hero-section {
            padding: 100px 16px 30px;
          }

          .content-section {
            padding: 20px 16px 60px;
          }

          .form-section,
          .benefits-section {
            padding: 24px;
          }

          .partner-type-card {
            padding: 20px;
          }
        }

        @media (prefers-color-scheme: light) {
          .partners-page {
            background: #f8fafc;
          }

          .bg-orb-1 {
            background: radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, transparent 70%);
          }

          .bg-orb-2 {
            background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
          }

          .site-name {
            color: #1e293b;
          }

          .back-link {
            color: #707070;
          }

          .back-link:hover {
            color: #1e293b;
          }

          .hero-title,
          .partner-type-title,
          .benefits-title,
          .form-title,
          .success-title {
            color: #1e293b;
          }

          .hero-subtitle,
          .success-text {
            color: #707070;
          }

          .partner-type-description {
            color: #707070;
          }

          .partner-type-card,
          .form-section {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.08);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }

          .benefits-section {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.08);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }

          .benefit-item {
            color: #374151;
          }

          .no-call-note {
            background: rgba(34, 197, 94, 0.08);
            border-color: rgba(34, 197, 94, 0.15);
          }

          .no-call-text {
            color: #16a34a;
          }

          .form-label {
            color: #374151;
          }

          input.form-input,
          input.form-input[type="text"],
          input.form-input[type="email"],
          select.form-select {
            background-color: #ffffff !important;
            border: 1px solid #d1d5db !important;
            color: #1e293b !important;
          }

          .form-input::placeholder {
            color: #9ca3af;
          }

          .form-helper {
            color: #9ca3af;
          }

          .form-select option {
            background: #ffffff;
            color: #374151;
          }

          .footer-section {
            border-top-color: rgba(99, 102, 241, 0.08);
          }
        }
      `}</style>

      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <header className="page-header">
        <Link href="/" className="back-link">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <Link href="/" className="site-brand">
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="12" fill="url(#partnersPlanetGradient)" />
            <ellipse
              cx="32"
              cy="32"
              rx="28"
              ry="10"
              stroke="url(#partnersOrbitGradient)"
              strokeWidth="2"
              fill="none"
              style={{ transform: 'rotate(-20deg)', transformOrigin: 'center' }}
            />
            <circle cx="54" cy="28" r="4" fill="url(#partnersMoonGradient)" />
            <defs>
              <linearGradient id="partnersPlanetGradient" x1="20" y1="20" x2="44" y2="44">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="partnersOrbitGradient" x1="4" y1="32" x2="60" y2="32">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="partnersMoonGradient" x1="50" y1="24" x2="58" y2="32">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
            </defs>
          </svg>
          <span className="site-name">College Orbit</span>
        </Link>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Gift size={16} />
            Partner Program
          </div>
          <h1 className="hero-title">
            Free Premium for <span>Your Audience</span>
          </h1>
          <p className="hero-subtitle">
            Whether you&apos;re a tutor, coach, creator, or org leader, we&apos;ll give you
            free premium codes to share. No meetings required.
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="content-container">
          <div className="partner-types-grid">
            {partnerTypes.map((type) => (
              <div key={type.title} className="partner-type-card">
                <div className="partner-type-icon">
                  <type.icon size={24} />
                </div>
                <h3 className="partner-type-title">{type.title}</h3>
                <p className="partner-type-description">{type.description}</p>
              </div>
            ))}
          </div>

          <div className="main-content">
            <div className="benefits-section">
              <ul className="benefits-list">
                {benefits.map((benefit) => (
                  <li key={benefit} className="benefit-item">
                    <CheckCircle size={18} className="benefit-check" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="no-call-note">
                <p className="no-call-text">
                  No calls needed. Just fill out the form and we&apos;ll email you everything you need.
                </p>
              </div>
            </div>

            <div className="form-section">
              {submitted ? (
                <div className="success-message">
                  <div className="success-icon">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="success-title">You&apos;re In!</h3>
                  <p className="success-text">
                    We&apos;ll send your partner pack within 24-48 hours. It includes
                    premium codes, a shareable message, and your referral link.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="form-title">Become a Partner</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">
                        Your Name <span>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Full name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Email <span>*</span>
                      </label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        I Am A... <span>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        required
                      >
                        <option value="">Select your role</option>
                        <option value="tutor">Tutor</option>
                        <option value="academic-coach">Academic Coach</option>
                        <option value="content-creator">Content Creator</option>
                        <option value="org-leader">Organization Leader</option>
                        <option value="ta">Teaching Assistant</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Approximate Audience Size <span>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={form.audience}
                        onChange={(e) => setForm({ ...form, audience: e.target.value })}
                        required
                      >
                        <option value="">Select size</option>
                        <option value="1-10">1-10 people</option>
                        <option value="11-50">11-50 people</option>
                        <option value="51-100">51-100 people</option>
                        <option value="100+">100+ people</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Website or Social Link
                      </label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://..."
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                      />
                      <p className="form-helper">Optional - helps us understand your audience</p>
                    </div>

                    <button type="submit" className="submit-btn" disabled={submitting}>
                      {submitting ? 'Sending...' : 'Request Partner Pack'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-columns">
            <div className="footer-column">
              <p className="footer-column-title">Product</p>
              <Link href="/pricing" className="footer-link">Pricing</Link>
              <Link href="/privacy" className="footer-link">Privacy</Link>
              <Link href="/terms" className="footer-link">Terms</Link>
            </div>
            <div className="footer-column">
              <p className="footer-column-title">Partner With Us</p>
              <Link href="/clubs" className="footer-link">For Clubs</Link>
              <Link href="/educators" className="footer-link">For Educators</Link>
              <Link href="/partners" className="footer-link">For Partners</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-contact">
              <a href="mailto:collegeorbit@protonmail.com" className="footer-contact-email">
                collegeorbit@protonmail.com
              </a>
            </div>
            <p className="footer-copyright">© {new Date().getFullYear()} College Orbit</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
