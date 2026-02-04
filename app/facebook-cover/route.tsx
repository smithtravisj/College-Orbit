import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
          padding: '40px 60px',
          background: 'linear-gradient(135deg, #0a0e13 0%, #0f1419 50%, #0a0e13 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Left side - Logo and Text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Logo and brand name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            {/* Logo - Planet with orbit */}
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
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
                fontSize: '42px',
                fontWeight: 700,
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
              fontSize: '24px',
              color: '#94a3b8',
              marginBottom: '24px',
            }}
          >
            Syncs with Canvas. Never miss a deadline.
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {['Canvas Sync', 'Assignments', 'Exams', 'Calendar'].map((feature) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '100px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#a5b4fc',
                }}
              >
                {feature}
              </div>
            ))}
          </div>

          {/* URL */}
          <div
            style={{
              marginTop: '20px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#6366f1',
            }}
          >
            collegeorbit.app
          </div>
        </div>

        {/* Right side - Mini dashboard mockup */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '220px',
            height: '240px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '16px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Today</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>Dashboard</span>
          </div>

          {/* Task cards */}
          {[
            { title: 'CS 301 Final Project', due: 'Due Tomorrow', color: '#ef4444' },
            { title: 'MATH 240 Problem Set', due: 'Due in 3 days', color: '#f59e0b' },
            { title: 'ENG 102 Essay Draft', due: 'Due Friday', color: '#22c55e' },
          ].map((task, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  width: '3px',
                  height: '28px',
                  background: task.color,
                  borderRadius: '2px',
                  marginRight: '10px',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#e2e8f0' }}>
                  {task.title}
                </span>
                <span style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                  {task.due}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 820,
      height: 312,
    }
  );
}
