'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Percent, Megaphone, CheckCircle, ArrowLeft } from 'lucide-react';

const benefits = [
  {
    icon: Percent,
    title: 'Exclusive Discounts',
    description: 'Get discounted premium access for your club members.',
  },
  {
    icon: Users,
    title: 'Ready-to-Share Message',
    description: 'We provide a pre-written message you can copy and paste to your group.',
  },
  {
    icon: Megaphone,
    title: 'Help Your Members',
    description: 'Give your club a tool to stay on top of assignments, exams, and deadlines.',
  },
];

export default function ClubsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    clubName: '',
    school: '',
    email: '',
    memberCount: '',
    platform: '',
    message: '',
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
          type: 'club',
          email: form.email,
          clubName: form.clubName,
          school: form.school,
          memberCount: form.memberCount,
          platform: form.platform,
          message: form.message,
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
    <div className="clubs-page">
      <style>{`
        .clubs-page {
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
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: stretch;
        }

        .benefits-section {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
        }

        .benefit-card {
          flex: 1;
          padding: 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .benefit-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .benefit-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          margin-bottom: 16px;
          color: #a5b4fc;
        }

        .benefit-title {
          font-size: 17px;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 8px;
        }

        .benefit-description {
          font-size: 14px;
          color: #7a8a9b;
          line-height: 1.6;
        }

        .form-section {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          position: relative;
          z-index: 2;
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

        input.form-input,
        input.form-input[type="text"],
        input.form-input[type="email"],
        textarea.form-input,
        select.form-select {
          width: 100%;
          padding: 12px 16px;
          background-color: #0f1114 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
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
          .content-container {
            grid-template-columns: 1fr;
            gap: 40px;
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

          .form-section {
            padding: 24px;
          }

          .benefit-card {
            padding: 18px;
          }
        }

        @media (prefers-color-scheme: light) {
          .clubs-page {
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

          .hero-title {
            color: #1e293b;
          }

          .hero-subtitle {
            color: #707070;
          }

          .section-title,
          .form-title,
          .benefit-title,
          .success-title {
            color: #1e293b;
          }

          .benefit-description,
          .success-text {
            color: #707070;
          }

          .benefit-card,
          .form-section {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.08);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
            <circle cx="32" cy="32" r="12" fill="url(#clubsPlanetGradient)" />
            <ellipse
              cx="32"
              cy="32"
              rx="28"
              ry="10"
              stroke="url(#clubsOrbitGradient)"
              strokeWidth="2"
              fill="none"
              style={{ transform: 'rotate(-20deg)', transformOrigin: 'center' }}
            />
            <circle cx="54" cy="28" r="4" fill="url(#clubsMoonGradient)" />
            <defs>
              <linearGradient id="clubsPlanetGradient" x1="20" y1="20" x2="44" y2="44">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="clubsOrbitGradient" x1="4" y1="32" x2="60" y2="32">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="clubsMoonGradient" x1="50" y1="24" x2="58" y2="32">
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
            <Users size={16} />
            For Student Clubs
          </div>
          <h1 className="hero-title">
            Partner With Us <span>For Your Club</span>
          </h1>
          <p className="hero-subtitle">
            We partner with student organizations to help your members stay organized.
            Get discounted premium access for your club.
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="content-container">
          <div className="benefits-section">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="benefit-card">
                <div className="benefit-icon">
                  <benefit.icon size={22} />
                </div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="form-section">
            {submitted ? (
              <div className="success-message">
                <div className="success-icon">
                  <CheckCircle size={32} />
                </div>
                <h3 className="success-title">Request Received!</h3>
                <p className="success-text">
                  We&apos;ll reach out within 24-48 hours with details on your club&apos;s
                  discount and a ready-to-share message for your members.
                </p>
              </div>
            ) : (
              <>
                <h3 className="form-title">Get a Club Discount</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">
                      Club Name <span>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Computer Science Club"
                      value={form.clubName}
                      onChange={(e) => setForm({ ...form, clubName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      School <span>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Brigham Young University"
                      value={form.school}
                      onChange={(e) => setForm({ ...form, school: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Your Email <span>*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="your.email@university.edu"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Approximate Members <span>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={form.memberCount}
                      onChange={(e) => setForm({ ...form, memberCount: e.target.value })}
                      required
                    >
                      <option value="">Select member count</option>
                      <option value="1-25">1-25 members</option>
                      <option value="26-50">26-50 members</option>
                      <option value="51-100">51-100 members</option>
                      <option value="100-999">100-999 members</option>
                      <option value="1000-9999">1,000-9,999 members</option>
                      <option value="10000+">10,000+ members</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Where does your club communicate? <span>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={form.platform}
                      onChange={(e) => setForm({ ...form, platform: e.target.value })}
                      required
                    >
                      <option value="">Select platform</option>
                      <option value="discord">Discord</option>
                      <option value="groupme">GroupMe</option>
                      <option value="slack">Slack</option>
                      <option value="instagram">Instagram</option>
                      <option value="email">Email List</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Message
                    </label>
                    <textarea
                      className="form-input"
                      placeholder="Anything else you'd like us to know?"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Request Club Discount'}
                  </button>
                </form>
              </>
            )}
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
