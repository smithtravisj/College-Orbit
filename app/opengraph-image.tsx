import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'College Orbit - Your Personal College Dashboard';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '60px 80px',
          background: 'linear-gradient(135deg, #0a0e13 0%, #0f1419 50%, #0a0e13 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Left side - Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
          }}
        >
          {/* Logo and brand name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {/* Logo - Planet with orbit */}
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="planetGrad" x1="20" y1="20" x2="44" y2="44">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="orbitGrad" x1="4" y1="32" x2="60" y2="32">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="moonGrad" x1="50" y1="24" x2="58" y2="32">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#c4b5fd" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="14" fill="url(#planetGrad)" />
              <ellipse
                cx="32"
                cy="32"
                rx="28"
                ry="10"
                stroke="url(#orbitGrad)"
                strokeWidth="2.5"
                fill="none"
                transform="rotate(-20 32 32)"
              />
              <circle cx="52" cy="24" r="5" fill="url(#moonGrad)" />
            </svg>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 600,
                color: '#e2e8f0',
                letterSpacing: '-0.01em',
              }}
            >
              College Orbit
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ color: '#f0f4f8' }}>Keep Everything</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #a5b4fc 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              In Orbit
            </span>
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '22px',
              color: '#94a3b8',
              lineHeight: 1.5,
              marginBottom: '40px',
            }}
          >
            Classes, assignments, exams, and tasks all in one dashboard. Built for college students.
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {['Canvas Sync', 'Assignments', 'Exams', 'Calendar', 'Notes'].map((feature) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 18px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '100px',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#a5b4fc',
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Dashboard preview mockup */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '420px',
            height: '480px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Mock header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Today</span>
              <span style={{ fontSize: '20px', fontWeight: 600, color: '#e2e8f0' }}>Dashboard</span>
            </div>
            <div
              style={{
                display: 'flex',
                width: '36px',
                height: '36px',
                background: 'rgba(99, 102, 241, 0.2)',
                borderRadius: '10px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>
          </div>

          {/* Mock task cards */}
          {[
            { title: 'CS 301 - Final Project', due: 'Due Tomorrow', color: '#ef4444' },
            { title: 'MATH 240 - Problem Set 5', due: 'Due in 3 days', color: '#f59e0b' },
            { title: 'ENG 102 - Essay Draft', due: 'Due Friday', color: '#22c55e' },
          ].map((task, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '40px',
                  background: task.color,
                  borderRadius: '2px',
                  marginRight: '14px',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>
                  {task.title}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {task.due}
                </span>
              </div>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                }}
              />
            </div>
          ))}

          {/* Mock upcoming section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: '8px',
              padding: '16px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#a5b4fc', marginBottom: '8px' }}>
              Upcoming Exam
            </span>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#e2e8f0' }}>
              CHEM 201 - Midterm 2
            </span>
            <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Monday, Feb 10 at 2:00 PM
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
