'use client';

import { useState, useEffect } from 'react';
import useAppStore from '@/lib/store';
import Button from '@/components/ui/Button';
import { getCollegeColorPalette } from '@/lib/collegeColors';

interface CollegeData {
  id: string;
  fullName: string;
  acronym: string;
  darkAccent: string;
  lightAccent: string;
}

interface CollegeSelectionModalProps {
  onClose: () => void;
}

export default function CollegeSelectionModal({ onClose }: CollegeSelectionModalProps) {
  const [university, setUniversity] = useState('');
  const [collegesList, setCollegesList] = useState<CollegeData[]>([]);
  const [saving, setSaving] = useState(false);
  const [accentColor, setAccentColor] = useState('');
  const { updateSettings } = useAppStore();

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/colleges');
        if (response.ok) {
          const data = await response.json();
          setCollegesList(data.colleges || []);
        }
      } catch (error) {
        console.error('Error fetching colleges:', error);
      }
    };
    fetchColleges();
  }, []);

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setUniversity(selected);

    if (selected) {
      const college = collegesList.find(c => c.fullName === selected);
      if (college) {
        setAccentColor(college.lightAccent);
      } else {
        const palette = getCollegeColorPalette(selected, 'light');
        setAccentColor(palette.accent);
      }
    } else {
      setAccentColor('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update university in settings and clear the flag
      await updateSettings({
        university: university || null,
        needsCollegeSelection: false,
      });

      // If a university was selected, also update the user's collegeId via profile API
      if (university) {
        const college = collegesList.find(c => c.fullName === university);
        if (college) {
          await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collegeId: college.id }),
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to save college selection:', error);
      onClose();
    }
  };

  const handleSkip = async () => {
    try {
      await updateSettings({ needsCollegeSelection: false });
    } catch (error) {
      console.error('Failed to dismiss college selection:', error);
    }
    onClose();
  };

  const buttonColor = accentColor || '#8b5cf6';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'collegeModalFadeIn 0.25s ease-out',
      }}
      onClick={handleSkip}
    >
      <div
        style={{
          background: '#18181b',
          border: `1px solid ${accentColor ? accentColor + '30' : '#27272a'}`,
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '380px',
          margin: '0 16px',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 48px ${accentColor ? accentColor + '15' : 'rgba(99, 102, 241, 0.08)'}`,
          animation: 'collegeModalSlideUp 0.3s ease-out',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: accentColor || 'var(--text)',
            marginBottom: '6px',
            transition: 'color 0.3s',
          }}>
            Select Your University
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            This personalizes your experience with school colors and quick links.
          </p>
        </div>

        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <select
            value={university}
            onChange={handleUniversityChange}
            style={{
              width: '100%',
              padding: '12px 30px 12px 12px',
              backgroundColor: 'var(--panel-2)',
              border: `1px solid ${accentColor ? accentColor + '50' : 'var(--border)'}`,
              color: university ? 'var(--text)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontFamily: 'inherit',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none' as any,
              cursor: 'pointer',
              transition: 'border-color 0.3s',
            }}
          >
            <option value="">Select University</option>
            {collegesList.map((college) => (
              <option key={college.fullName} value={college.fullName}>
                {college.fullName}
              </option>
            ))}
          </select>
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)">
              <path d="M4 6l4 4 4-4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: '1px solid #3f3f46',
              borderRadius: '12px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Skip
          </button>
          <Button
            variant="primary"
            size="lg"
            disabled={saving || !university}
            onClick={handleSave}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              background: university
                ? `linear-gradient(155deg, rgba(255,255,255,0.45) 0%, rgba(0,0,0,0.35) 100%), ${buttonColor}`
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              boxShadow: university
                ? `0 4px 14px ${buttonColor}60, inset 0 0 0 100px rgba(0,0,0,0.15)`
                : '0 4px 14px rgba(99, 102, 241, 0.4)',
              opacity: !university ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes collegeModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes collegeModalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
