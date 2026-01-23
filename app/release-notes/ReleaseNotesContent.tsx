'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useIsMobile } from '@/hooks/useMediaQuery';
import releases from '@/data/releases.json';

interface Release {
  version: string;
  date: string;
  changes: string[];
}

export default function ReleaseNotesContent() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const formatDate = (dateString: string) => {
    // Parse as local date to avoid timezone offset issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Page Header */}
      <div className="mx-auto w-full max-w-[900px]" style={{ padding: isMobile ? '0px 20px 8px' : '0px 24px 12px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '22px', marginBottom: '8px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <ArrowLeft size={14} />
          Back
        </button>
        <div style={{ marginTop: '-8px' }}>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Release Notes
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            See what's new in College Orbit.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[900px] flex flex-col gap-6" style={{ padding: isMobile ? '12px 20px 24px' : '12px 24px 24px' }}>
        {(releases.releases as Release[]).map((release) => (
          <Card key={release.version} title={`Version ${release.version}`}>
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(release.date)}
              </p>
              <ul className="space-y-2">
                {release.changes.map((change, index) => (
                  <li
                    key={index}
                    className="text-sm flex items-start gap-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
