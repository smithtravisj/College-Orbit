'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckSquare,
  Clock,
  BookOpen,
  Bell,
  BarChart3,
  FileText,
  CalendarDays,
  Link as LinkIcon,
  Target,
  Repeat,
  Palette
} from 'lucide-react';

const coreFeatures = [
  {
    icon: Calendar,
    title: 'Class Schedule',
    description: 'See your classes with meeting times, locations, and quick links to course resources.',
  },
  {
    icon: CheckSquare,
    title: 'Tasks & Deadlines',
    description: 'Track assignments and due dates. Sorted so the important stuff is always visible.',
  },
  {
    icon: BookOpen,
    title: 'Exam Tracking',
    description: 'Keep your exams organized with dates, locations, and study notes.',
  },
  {
    icon: CalendarDays,
    title: 'Weekly Calendar',
    description: 'View your entire week at a glance. Classes, exams, and deadlines all in one place.',
  },
];

const secondaryFeatures = [
  {
    icon: FileText,
    title: 'Notes',
    description: 'Capture ideas and study notes. Organize by course or keep them freeform.',
  },
  {
    icon: Clock,
    title: 'Pomodoro Timer',
    description: 'Built-in focus timer with customizable work and break intervals.',
  },
  {
    icon: BarChart3,
    title: 'GPA Calculator',
    description: 'Track your grades across semesters and see where your GPA is heading.',
  },
  {
    icon: Bell,
    title: 'Reminders',
    description: 'Get notified about upcoming exams and deadlines before they sneak up.',
  },
  {
    icon: Repeat,
    title: 'Recurring Tasks',
    description: 'Set up weekly readings or regular assignments that repeat automatically.',
  },
  {
    icon: LinkIcon,
    title: 'Quick Links',
    description: 'One-click access to Canvas, email, registration, and other school resources.',
  },
  {
    icon: Target,
    title: 'Due Soon',
    description: 'See everything coming up in the next week at a glance.',
  },
  {
    icon: Palette,
    title: 'School Colors',
    description: 'Personalize with your university\'s colors. BYU, Utah, and more supported.',
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          min-height: 100vh;
          background: #0a0e13;
          position: relative;
        }

        /* Background gradient orbs */
        .bg-orb {
          position: fixed;
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
          background: radial-gradient(circle, rgba(148, 163, 184, 0.08) 0%, transparent 70%);
        }

        .bg-orb-2 {
          width: 500px;
          height: 500px;
          bottom: 20%;
          right: -150px;
          background: radial-gradient(circle, rgba(148, 163, 184, 0.06) 0%, transparent 70%);
        }

        .landing-header {
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

        .site-name {
          font-size: 22px;
          font-weight: 600;
          color: #e2e8f0;
          letter-spacing: -0.01em;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-sign-in {
          font-size: 14px;
          font-weight: 500;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .header-sign-in:hover {
          color: #e2e8f0;
        }

        .header-get-started {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          background: #e2e8f0;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .header-get-started:hover {
          background: #f1f5f9;
        }

        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 140px 24px 40px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(148, 163, 184, 0.06) 0%, transparent 60%);
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 750px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 18px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 28px;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '12px'});
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .hero-title {
          font-size: clamp(36px, 7vw, 64px);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 24px;
          color: #f0f4f8;
          letter-spacing: -0.02em;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '20px'});
          transition: opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s;
        }

        .hero-title span {
          background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: clamp(17px, 2.5vw, 21px);
          color: #94a3b8;
          max-width: 550px;
          margin: 0 auto 0;
          line-height: 1.65;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '20px'});
          transition: opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s;
        }

        .bottom-cta {
          margin-top: 64px;
          text-align: center;
        }

        .bottom-cta-text {
          font-size: 22px;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 24px;
        }

        .cta-buttons {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: #e2e8f0;
          color: #0f172a;
          font-size: 16px;
          font-weight: 600;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          background: #f1f5f9;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: rgba(255, 255, 255, 0.03);
          color: #e2e8f0;
          font-size: 16px;
          font-weight: 600;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .features-section {
          padding: 40px 24px 100px;
          position: relative;
          z-index: 1;
          background: linear-gradient(180deg, transparent 0%, rgba(13, 17, 23, 0.8) 100%);
        }

        .features-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
        }

        .features-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .features-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .features-title {
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 700;
          color: #f0f4f8;
          margin-bottom: 14px;
          letter-spacing: -0.01em;
        }

        .features-subtitle {
          font-size: 17px;
          color: #64748b;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
        }

        .secondary-features-header {
          margin-top: 48px;
          margin-bottom: 24px;
          text-align: center;
        }

        .secondary-features-title {
          font-size: 18px;
          font-weight: 500;
          color: #64748b;
        }

        .feature-card-secondary {
          padding: 22px;
        }

        .feature-card-secondary .feature-icon {
          width: 38px;
          height: 38px;
          margin-bottom: 14px;
        }

        .feature-card-secondary .feature-title {
          font-size: 15px;
        }

        .feature-card-secondary .feature-description {
          font-size: 13px;
        }

        .feature-card {
          padding: 26px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .feature-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          margin-bottom: 18px;
          color: #94a3b8;
        }

        .feature-title {
          font-size: 17px;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 10px;
        }

        .feature-description {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
        }

        .footer-section {
          padding: 32px 24px;
          text-align: center;
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-text {
          font-size: 14px;
          color: #475569;
        }

        .footer-links {
          display: flex;
          gap: 28px;
          justify-content: center;
          margin-top: 14px;
        }

        .footer-link {
          font-size: 14px;
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #e2e8f0;
        }

        @media (max-width: 640px) {
          .hero-section {
            padding: 120px 20px 40px;
          }

          .cta-buttons {
            flex-direction: column;
            width: 100%;
            max-width: 300px;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            justify-content: center;
          }

          .features-section {
            padding: 60px 20px 80px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .bg-orb-1 {
            width: 400px;
            height: 400px;
            top: -150px;
            left: -150px;
          }

          .bg-orb-2 {
            display: none;
          }
        }

        /* Light mode styles */
        @media (prefers-color-scheme: light) {
          .landing-page {
            background: #f8fafc;
          }

          .bg-orb-1 {
            background: radial-gradient(circle, rgba(100, 116, 139, 0.08) 0%, transparent 70%);
          }

          .bg-orb-2 {
            background: radial-gradient(circle, rgba(100, 116, 139, 0.06) 0%, transparent 70%);
          }

          .hero-section::before {
            background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(100, 116, 139, 0.06) 0%, transparent 60%);
          }

          .site-name {
            color: #1e293b;
          }

          .header-sign-in {
            color: #64748b;
          }

          .header-sign-in:hover {
            color: #1e293b;
          }

          .header-get-started {
            color: #f8fafc;
            background: #1e293b;
          }

          .header-get-started:hover {
            background: #334155;
          }

          .hero-badge {
            background: rgba(0, 0, 0, 0.05);
            border-color: rgba(0, 0, 0, 0.1);
            color: #64748b;
          }

          .hero-title {
            color: #1e293b;
          }

          .hero-title span {
            background: linear-gradient(135deg, #475569 0%, #64748b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .hero-subtitle {
            color: #64748b;
          }

          .features-section {
            background: linear-gradient(180deg, transparent 0%, rgba(241, 245, 249, 0.8) 100%);
          }

          .features-section::before {
            background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.06), transparent);
          }

          .features-title {
            color: #1e293b;
          }

          .features-subtitle {
            color: #64748b;
          }

          .feature-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%);
            border-color: rgba(0, 0, 0, 0.08);
          }

          .feature-card:hover {
            border-color: rgba(0, 0, 0, 0.12);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
          }

          .feature-card::before {
            background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.06), transparent);
          }

          .feature-icon {
            background: rgba(0, 0, 0, 0.05);
            color: #64748b;
          }

          .feature-title {
            color: #1e293b;
          }

          .feature-description {
            color: #64748b;
          }

          .secondary-features-title {
            color: #64748b;
          }

          .bottom-cta-text {
            color: #1e293b;
          }

          .btn-primary {
            background: #1e293b;
            color: #f8fafc;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }

          .btn-primary:hover {
            background: #334155;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          }

          .btn-secondary {
            background: rgba(0, 0, 0, 0.03);
            color: #1e293b;
            border-color: rgba(0, 0, 0, 0.1);
          }

          .btn-secondary:hover {
            background: rgba(0, 0, 0, 0.06);
            border-color: rgba(0, 0, 0, 0.15);
          }

          .footer-section {
            border-top-color: rgba(0, 0, 0, 0.06);
          }

          .footer-link {
            color: #64748b;
          }

          .footer-link:hover {
            color: #1e293b;
          }
        }
      `}</style>

      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Header */}
      <header className="landing-header">
        <span className="site-name">College Survival Tool</span>
        <nav className="header-nav">
          <Link href="/login" className="header-sign-in">Sign In</Link>
          <Link href="/signup" className="header-get-started">Get Started</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            Designed for college students
          </div>

          <h1 className="hero-title">
            Your College Life,<br /><span>Simplified</span>
          </h1>

          <p className="hero-subtitle">
            Track classes, manage deadlines, and stay on top of your semester with a dashboard that keeps everything in one place. Free to use.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">Everything you need to stay organized</h2>
            <p className="features-subtitle">Simple tools that work together to keep you on track.</p>
          </div>

          <div className="features-grid">
            {coreFeatures.map((feature) => (
              <div key={feature.title} className="feature-card">
                <div className="feature-icon">
                  <feature.icon size={22} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="secondary-features-header">
            <p className="secondary-features-title">And everything else you'd expect...</p>
          </div>

          <div className="features-grid secondary-grid">
            {secondaryFeatures.map((feature) => (
              <div key={feature.title} className="feature-card feature-card-secondary">
                <div className="feature-icon">
                  <feature.icon size={20} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="bottom-cta">
            <p className="bottom-cta-text">Ready to get organized?</p>
            <div className="cta-buttons">
              <Link href="/signup" className="btn-primary">
                Start organizing for free
              </Link>
              <Link href="/login" className="btn-secondary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-links">
          <Link href="/privacy" className="footer-link">Privacy</Link>
          <Link href="/terms" className="footer-link">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
