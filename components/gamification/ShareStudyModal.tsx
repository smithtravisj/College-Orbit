'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Image, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import ShareStudyCard from './ShareStudyCard';
import useAppStore from '@/lib/store';

type CardFormat = 'story' | 'square';

interface ShareStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareStudyModal({ isOpen, onClose }: ShareStudyModalProps) {
  const [format, setFormat] = useState<CardFormat>('story');
  const [downloading, setDownloading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const gamification = useAppStore((state) => state.gamification);
  const university = useAppStore((state) => state.settings.university);

  const generateCanvas = useCallback(async () => {
    if (!captureRef.current) return null;
    return html2canvas(captureRef.current, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#070b10',
      width: 1080,
      height: format === 'story' ? 1920 : 1080,
    });
  }, [format]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      const dataUrl = canvas.toDataURL('image/png');

      // iOS Safari doesn't support link.click() for downloads well
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.open(dataUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.download = `college-orbit-stats-${format}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setDownloading(false);
    }
  }, [format, downloading, generateCanvas]);

  const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare;

  const handleShare = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      const file = new File([blob], `college-orbit-stats-${format}.png`, { type: 'image/png' });
      const shareData = { files: [file], title: 'My Study Stats', text: 'Check out my study stats on College Orbit!' };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to download if share doesn't support files
        handleDownload();
      }
    } catch (err: unknown) {
      // User cancelled share — not an error
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to share:', err);
      }
    } finally {
      setDownloading(false);
    }
  }, [format, downloading, generateCanvas, handleDownload]);

  if (!isOpen || !gamification) return null;
  if (typeof document === 'undefined') return null;

  // Preview dimensions — scale the full-size card down to fit the modal
  const previewMaxWidth = 360;
  const fullWidth = 1080;
  const fullHeight = format === 'story' ? 1920 : 1080;
  const previewScale = previewMaxWidth / fullWidth;
  const previewHeight = fullHeight * previewScale;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: 'var(--panel-solid, var(--panel))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card, 12px)',
        maxWidth: '440px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image size={20} style={{ color: 'var(--link)' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Share Your Stats
            </h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Format Toggle */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: '8px' }}>
          {(['story', 'square'] as CardFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${format === f ? 'var(--link)' : 'var(--border)'}`,
                backgroundColor: format === f ? 'var(--link)' : 'transparent',
                color: format === f ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              {f === 'story' ? 'Story (9:16)' : 'Square (1:1)'}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: `${previewMaxWidth}px`,
            height: `${previewHeight}px`,
            overflow: 'hidden',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              width: `${fullWidth}px`,
              height: `${fullHeight}px`,
            }}>
              <ShareStudyCard
                data={gamification}
                university={university}
                format={format}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--link)',
              color: '#fff',
              cursor: downloading ? 'wait' : 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: downloading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <Download size={18} />
            {downloading ? 'Generating...' : 'Download'}
          </button>
          {canShare && (
            <button
              onClick={handleShare}
              disabled={downloading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--panel-solid, var(--panel))',
                color: 'var(--text)',
                cursor: downloading ? 'wait' : 'pointer',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: downloading ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <Share2 size={18} />
              Share
            </button>
          )}
        </div>
      </div>

      {/* Off-screen full-size card for html2canvas capture */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }} aria-hidden="true">
        <ShareStudyCard
          ref={captureRef}
          data={gamification}
          university={university}
          format={format}
        />
      </div>
    </div>,
    document.body
  );
}
