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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b0f14 0%, #1a1f2e 50%, #0b0f14 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Orbital rings decoration */}
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            border: '2px solid rgba(124, 58, 237, 0.2)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            border: '1px solid rgba(124, 58, 237, 0.1)',
            display: 'flex',
          }}
        />

        {/* Logo circle */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            boxShadow: '0 0 60px rgba(124, 58, 237, 0.5)',
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <ellipse cx="12" cy="12" rx="10" ry="4" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#e6edf6',
            letterSpacing: '-0.02em',
            marginBottom: '16px',
            display: 'flex',
          }}
        >
          College Orbit
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: '#9ca3af',
            display: 'flex',
          }}
        >
          Your Personal College Dashboard
        </div>

        {/* Features bar */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '48px',
          }}
        >
          {['Assignments', 'Exams', 'Courses', 'Notes'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#7c3aed',
                fontSize: '20px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#7c3aed',
                  display: 'flex',
                }}
              />
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
