'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, Shield, Clock, ArrowLeft, CheckCircle2, CheckCircle } from 'lucide-react';

const keyPoints = [
  {
    icon: Shield,
    title: 'Privacy-First',
    description: 'We never sell student data. Students control their own information.',
  },
  {
    icon: Clock,
    title: '60 Seconds to Try',
    description: 'Students can sign up and start using it immediately with Canvas sync.',
  },
  {
    icon: GraduationCap,
    title: 'Built for Students',
    description: 'Designed as a student resource first. We partner with educators to make it even more accessible.',
  },
];

const features = [
  'Track assignments and deadlines in one place',
  'Sync directly with Canvas LMS',
  'Calendar views with exam tracking',
  'Free tier available for all students',
  'No ads, no data selling',
];

export default function EducatorsPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    school: '',
    studentCount: '',
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
          type: 'educator',
          email: form.email,
          name: form.name,
          role: form.role,
          school: form.school,
          audienceSize: form.studentCount,
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
    <div className="educators-page">
      <style>{`
        .educators-page {
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

        .key-points-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 60px;
        }

        .key-point-card {
          padding: 28px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
        }

        .key-point-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .key-point-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.12);
          border-radius: 14px;
          margin: 0 auto 18px;
          color: #a5b4fc;
        }

        .key-point-title {
          font-size: 18px;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 10px;
        }

        .key-point-description {
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

        .info-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          position: relative;
          z-index: 2;
        }

        .info-title {
          font-size: 20px;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 20px;
        }

        .info-description {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 12px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #e2e8f0;
        }

        .feature-check {
          color: #22c55e;
          flex-shrink: 0;
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
          .key-points-grid {
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

          .info-card,
          .form-section {
            padding: 24px;
          }

          .key-point-card {
            padding: 20px;
          }
        }

        @media (prefers-color-scheme: light) {
          .educators-page {
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
          .key-point-title,
          .info-title,
          .form-title,
          .success-title {
            color: #1e293b;
          }

          .hero-subtitle,
          .info-description,
          .success-text {
            color: #707070;
          }

          .key-point-description {
            color: #707070;
          }

          .key-point-card,
          .info-card,
          .form-section {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.08);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }

          .feature-item {
            color: #374151;
          }

          .form-label {
            color: #374151;
          }

          input.form-input,
          input.form-input[type="text"],
          input.form-input[type="email"],
          textarea.form-input,
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
            <circle cx="32" cy="32" r="12" fill="url(#eduPlanetGradient)" />
            <ellipse
              cx="32"
              cy="32"
              rx="28"
              ry="10"
              stroke="url(#eduOrbitGradient)"
              strokeWidth="2"
              fill="none"
              style={{ transform: 'rotate(-20deg)', transformOrigin: 'center' }}
            />
            <circle cx="54" cy="28" r="4" fill="url(#eduMoonGradient)" />
            <defs>
              <linearGradient id="eduPlanetGradient" x1="20" y1="20" x2="44" y2="44">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="eduOrbitGradient" x1="4" y1="32" x2="60" y2="32">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="eduMoonGradient" x1="50" y1="24" x2="58" y2="32">
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
            <GraduationCap size={16} />
            For Educators
          </div>
          <h1 className="hero-title">
            An Optional Resource <span>For Your Students</span>
          </h1>
          <p className="hero-subtitle">
            College Orbit helps students stay organized with their coursework.
            Partner with us to bring it to your students.
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="content-container">
          <div className="key-points-grid">
            {keyPoints.map((point) => (
              <div key={point.title} className="key-point-card">
                <div className="key-point-icon">
                  <point.icon size={26} />
                </div>
                <h3 className="key-point-title">{point.title}</h3>
                <p className="key-point-description">{point.description}</p>
              </div>
            ))}
          </div>

          <div className="main-content">
            <div className="info-card">
              <h2 className="info-title">What Students Use It For</h2>
              <p className="info-description">
                Students use College Orbit to track assignments, deadlines, and exams in one place.
                It syncs with Canvas to automatically import their coursework.
              </p>
              <ul className="feature-list">
                {features.map((feature) => (
                  <li key={feature} className="feature-item">
                    <CheckCircle2 size={18} className="feature-check" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="form-section">
              {submitted ? (
                <div className="success-message">
                  <div className="success-icon">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="success-title">Request Received!</h3>
                  <p className="success-text">
                    We&apos;ll send your premium codes within 24-48 hours along with
                    a ready-to-share message for your students.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="form-title">Request Premium Codes</h3>
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
                        placeholder="your.email@university.edu"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Role <span>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        required
                      >
                        <option value="">Select your role</option>
                        <option value="ta">Teaching Assistant</option>
                        <option value="professor">Professor</option>
                        <option value="instructor">Instructor</option>
                        <option value="academic-advisor">Academic Advisor</option>
                        <option value="tutor">Tutor</option>
                        <option value="other">Other</option>
                      </select>
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
                        Approximate Students <span>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={form.studentCount}
                        onChange={(e) => setForm({ ...form, studentCount: e.target.value })}
                        required
                      >
                        <option value="">Select count</option>
                        <option value="1-25">1-25 students</option>
                        <option value="26-50">26-50 students</option>
                        <option value="51-100">51-100 students</option>
                        <option value="100-999">100-999 students</option>
                        <option value="1000-9999">1,000-9,999 students</option>
                        <option value="10000+">10,000+ students</option>
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
                      {submitting ? 'Sending...' : 'Request Codes'}
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
