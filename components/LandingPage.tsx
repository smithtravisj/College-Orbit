'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  PenLine,
  Clock,
  BookOpen,
  BarChart3,
  FileText,
  CalendarDays,
  Target,
  Trophy,
  Palette,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';

const coreFeatures = [
  {
    icon: RefreshCw,
    title: 'Canvas Integration',
    description: 'Sync courses, assignments, grades, and events directly from Canvas.',
  },
  {
    icon: Calendar,
    title: 'Course Management',
    description: 'Track your classes with meeting times, locations, and quick links to course resources.',
  },
  {
    icon: PenLine,
    title: 'Work',
    description: 'Manage tasks, assignments, readings, and projects with priorities, checklists, tags, and links to notes and files.',
  },
  {
    icon: CalendarDays,
    title: 'Calendar',
    description: 'See your schedule with month, week, and day views. Export to Google Calendar or Apple Calendar.',
  },
];

const secondaryFeatures = [
  {
    icon: BookOpen,
    title: 'Exam Tracker',
    description: 'Never miss an exam. Track dates, times, locations, and add notes for each test.',
  },
  {
    icon: Target,
    title: 'Timeline Dashboard',
    description: 'See classes, tasks, assignments, exams, and events in one unified view with Today and Week toggles.',
  },
  {
    icon: Trophy,
    title: 'Progress & Achievements',
    description: 'Earn XP, unlock achievements, track streaks, and compete on your college\'s leaderboard with friends.',
  },
  {
    icon: FileText,
    title: 'Rich Notes',
    description: 'Rich text editor with formatting, folders, course organization, and links to work items.',
  },
  {
    icon: BarChart3,
    title: 'GPA & Grade Tools',
    description: 'Track grades, calculate your GPA, project what-if scenarios, and find what you need on your final.',
  },
  {
    icon: Clock,
    title: 'Pomodoro Timer',
    description: 'Built-in focus timer with customizable work and break intervals to boost productivity.',
  },
  {
    icon: ShoppingCart,
    title: 'Shopping Lists',
    description: 'Manage grocery lists, wishlists, and pantry inventory. Move purchased items between lists.',
  },
  {
    icon: Palette,
    title: 'University Themes',
    description: 'Personalize with your school\'s colors, dark or light mode, and colorblind-friendly options.',
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
          overflow-x: hidden;
        }

        /* Background gradient orbs */
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
          color: white;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .header-get-started:hover {
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
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
          background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
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
          background: linear-gradient(135deg, #a5b4fc 0%, #8b5cf6 100%);
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

        .hero-trial-note {
          font-size: 14px;
          color: #64748b;
          margin-top: 24px;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? '0' : '20px'});
          transition: opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s;
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
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #7c7ff7 0%, #9d6ff9 100%);
          box-shadow: 0 8px 30px rgba(99, 102, 241, 0.45);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: rgba(99, 102, 241, 0.08);
          color: #e2e8f0;
          font-size: 16px;
          font-weight: 600;
          border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .btn-secondary:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.35);
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
          color: #7a8a9b;
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
          color: #7a8a9b;
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
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
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
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .feature-card:hover {
          border-color: rgba(255, 255, 255, 0.18);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
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
          background: rgba(99, 102, 241, 0.12);
          border-radius: 12px;
          margin-bottom: 18px;
          color: #a5b4fc;
        }

        .feature-title {
          font-size: 17px;
          font-weight: 600;
          color: #f0f4f8;
          margin-bottom: 10px;
        }

        .feature-description {
          font-size: 14px;
          color: #7a8a9b;
          line-height: 1.6;
        }

        .footer-section {
          padding: 40px 24px;
          text-align: center;
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .footer-contact {
          margin-bottom: 20px;
        }

        .footer-contact-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 6px;
        }

        .footer-contact-email {
          font-size: 15px;
          color: #a5b4fc;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .footer-contact-email:hover {
          color: #c4b5fd;
        }

        .footer-links {
          display: flex;
          gap: 28px;
          justify-content: center;
          margin-top: 16px;
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

        .footer-copyright {
          font-size: 12px;
          color: #475569;
          margin-top: 20px;
        }

        @media (max-width: 640px) {
          .landing-header {
            padding: 16px 16px;
          }

          .site-name {
            font-size: 18px;
          }

          .header-nav {
            gap: 12px;
          }

          .header-sign-in {
            font-size: 13px;
          }

          .header-get-started {
            font-size: 12px;
            padding: 6px 12px;
            border-radius: 6px;
          }

          .hero-section {
            padding: 80px 16px 20px;
          }

          .hero-badge {
            font-size: 12px;
            padding: 5px 12px;
            margin-bottom: 14px;
          }

          .hero-title {
            font-size: 28px;
            margin-bottom: 10px;
          }

          .hero-subtitle {
            font-size: 14px;
            line-height: 1.5;
          }

          .hero-trial-note {
            font-size: 12px;
            margin-top: 16px;
          }

          .features-section {
            padding: 20px 16px 40px;
          }

          .features-header {
            margin-bottom: 20px;
          }

          .features-title {
            font-size: 20px;
            margin-bottom: 6px;
          }

          .features-subtitle {
            font-size: 13px;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .feature-card {
            padding: 14px 16px;
            border-radius: 10px;
          }

          .feature-icon {
            width: 32px;
            height: 32px;
            margin-bottom: 10px;
            border-radius: 8px;
          }

          .feature-title {
            font-size: 14px;
            margin-bottom: 4px;
          }

          .feature-description {
            font-size: 12px;
            line-height: 1.45;
          }

          .secondary-features-header {
            margin-top: 16px;
            margin-bottom: 8px;
          }

          .secondary-features-title {
            font-size: 13px;
          }

          .feature-card-secondary {
            padding: 10px 12px;
          }

          .feature-card-secondary .feature-icon {
            width: 26px;
            height: 26px;
            margin-bottom: 6px;
          }

          .feature-card-secondary .feature-title {
            font-size: 12px;
          }

          .feature-card-secondary .feature-description {
            font-size: 11px;
          }

          .bottom-cta {
            margin-top: 24px;
          }

          .bottom-cta-text {
            font-size: 15px;
            margin-bottom: 12px;
          }

          .cta-buttons {
            flex-direction: row;
            width: 100%;
            gap: 10px;
          }

          .btn-primary,
          .btn-secondary {
            flex: 1;
            justify-content: center;
            padding: 8px 12px;
            font-size: 12px;
            border-radius: 6px;
          }

          .footer-section {
            padding: 20px 16px;
          }

          .footer-links {
            gap: 20px;
            margin-top: 0;
          }

          .footer-link {
            font-size: 12px;
          }

          .bg-orb-1 {
            width: 300px;
            height: 300px;
            top: -100px;
            left: -100px;
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
            background: radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, transparent 70%);
          }

          .bg-orb-2 {
            background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
          }

          .hero-section::before {
            background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.06) 0%, transparent 60%);
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
            color: white;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
          }

          .header-get-started:hover {
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
          }

          .hero-badge {
            background: rgba(99, 102, 241, 0.08);
            border-color: rgba(99, 102, 241, 0.15);
            color: #6366f1;
          }

          .hero-title {
            color: #1e293b;
          }

          .hero-title span {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .hero-subtitle {
            color: #64748b;
          }

          .hero-trial-note {
            color: #94a3b8;
          }

          .features-section {
            background: linear-gradient(180deg, transparent 0%, rgba(241, 245, 249, 0.8) 100%);
          }

          .features-section::before {
            background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.08), transparent);
          }

          .features-title {
            color: #1e293b;
          }

          .features-subtitle {
            color: #64748b;
          }

          .feature-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
            border-color: rgba(99, 102, 241, 0.1);
          }

          .feature-card:hover {
            border-color: rgba(99, 102, 241, 0.2);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.9) 100%);
            box-shadow: 0 12px 40px rgba(99, 102, 241, 0.12);
          }

          .feature-card::before {
            background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
          }

          .feature-icon {
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
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
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25);
          }

          .btn-primary:hover {
            background: linear-gradient(135deg, #7c7ff7 0%, #9d6ff9 100%);
            box-shadow: 0 8px 30px rgba(99, 102, 241, 0.35);
          }

          .btn-secondary {
            background: rgba(99, 102, 241, 0.06);
            color: #1e293b;
            border-color: rgba(99, 102, 241, 0.15);
          }

          .btn-secondary:hover {
            background: rgba(99, 102, 241, 0.12);
            border-color: rgba(99, 102, 241, 0.25);
          }

          .footer-section {
            border-top-color: rgba(99, 102, 241, 0.08);
          }

          .footer-contact-email {
            color: #6366f1;
          }

          .footer-contact-email:hover {
            color: #8b5cf6;
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
        <div className="site-brand">
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="12" fill="url(#landingPlanetGradient)" />
            <ellipse
              cx="32"
              cy="32"
              rx="28"
              ry="10"
              stroke="url(#landingOrbitGradient)"
              strokeWidth="2"
              fill="none"
              style={{ transform: 'rotate(-20deg)', transformOrigin: 'center' }}
            />
            <circle cx="54" cy="28" r="4" fill="url(#landingMoonGradient)" />
            <defs>
              <linearGradient id="landingPlanetGradient" x1="20" y1="20" x2="44" y2="44">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="landingOrbitGradient" x1="4" y1="32" x2="60" y2="32">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="landingMoonGradient" x1="50" y1="24" x2="58" y2="32">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
            </defs>
          </svg>
          <span className="site-name">College Orbit</span>
        </div>
        <nav className="header-nav">
          <Link href="/login" className="header-sign-in">Sign In</Link>
          <Link href="/signup" className="header-get-started">Start Free Trial</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            Designed for college students
          </div>

          <h1 className="hero-title">
            Keep Everything<br /><span>In Orbit</span>
          </h1>

          <p className="hero-subtitle">
            Classes, assignments, exams, and tasks all revolving around one central dashboard. Stay organized without the chaos.
          </p>

          <p className="hero-trial-note">
            14-day free trial • No credit card required
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
                Start your free trial
              </Link>
              <Link href="/pricing" className="btn-secondary">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-contact">
            <p className="footer-contact-label">Questions or feedback?</p>
            <a href="mailto:collegeorbit@protonmail.com" className="footer-contact-email">
              collegeorbit@protonmail.com
            </a>
          </div>
          <div className="footer-links">
            <Link href="/pricing" className="footer-link">Pricing</Link>
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/terms" className="footer-link">Terms</Link>
          </div>
          <p className="footer-copyright">© {new Date().getFullYear()} College Orbit</p>
        </div>
      </footer>
    </div>
  );
}
