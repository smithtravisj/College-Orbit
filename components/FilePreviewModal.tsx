'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, FileText, ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import mammoth from 'mammoth';

interface FileItem {
  name: string;
  url: string;
  size: number;
}

interface FilePreviewModalProps {
  file: FileItem | null;
  files?: FileItem[];
  currentIndex?: number;
  onClose: () => void;
  onNavigate?: (file: FileItem, index: number) => void;
}

export default function FilePreviewModal({ file, files, currentIndex = 0, onClose, onNavigate }: FilePreviewModalProps) {
  const isMobile = useIsMobile();
  const [textContent, setTextContent] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fittedSize, setFittedSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const hasPrev = files && files.length > 1 && currentIndex > 0;
  const hasNext = files && files.length > 1 && currentIndex < files.length - 1;

  // Reset when file changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setFittedSize({ width: 0, height: 0 });
  }, [currentIndex]);

  // Capture fitted size after image renders
  useEffect(() => {
    if (imageRef.current && scale === 1 && fittedSize.width === 0) {
      const rect = imageRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setFittedSize({ width: rect.width, height: rect.height });
      }
    }
  });

  // Load text content for text files
  useEffect(() => {
    if (!file) return;
    const mimeType = getMimeType(file.url);
    if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/javascript') {
      try {
        const base64Data = file.url.split(',')[1];
        setTextContent(atob(base64Data));
      } catch {
        setTextContent(null);
      }
    } else {
      setTextContent(null);
    }
  }, [file]);

  // Load docx content
  useEffect(() => {
    if (!file) return;
    const mimeType = getMimeType(file.url);
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setDocxLoading(true);
      setDocxHtml(null);
      try {
        const base64Data = file.url.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        mammoth.convertToHtml({ arrayBuffer: bytes.buffer })
          .then((result) => {
            setDocxHtml(result.value);
            setDocxLoading(false);
          })
          .catch(() => {
            setDocxHtml(null);
            setDocxLoading(false);
          });
      } catch {
        setDocxHtml(null);
        setDocxLoading(false);
      }
    } else {
      setDocxHtml(null);
    }
  }, [file]);

  const zoomStep = 0.25;
  const zoomIn = useCallback(() => setScale(s => Math.min(4, +(s + zoomStep).toFixed(2))), [zoomStep]);
  const zoomOut = useCallback(() => setScale(s => Math.max(0.25, +(s - zoomStep).toFixed(2))), [zoomStep]);
  const rotateLeft = useCallback(() => setRotation(r => r - 90), []);
  const rotateRight = useCallback(() => setRotation(r => r + 90), []);
  const reset = useCallback(() => { setScale(1); setRotation(0); }, []);

  const goPrev = useCallback(() => {
    if (hasPrev && onNavigate && files) onNavigate(files[currentIndex - 1], currentIndex - 1);
  }, [hasPrev, onNavigate, files, currentIndex]);

  const goNext = useCallback(() => {
    if (hasNext && onNavigate && files) onNavigate(files[currentIndex + 1], currentIndex + 1);
  }, [hasNext, onNavigate, files, currentIndex]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': e.preventDefault(); goPrev(); break;
        case 'ArrowRight': e.preventDefault(); goNext(); break;
        case '+': case '=': e.preventDefault(); zoomIn(); break;
        case '-': e.preventDefault(); zoomOut(); break;
        case 'r': case 'R': if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); rotateRight(); } break;
        case '0': e.preventDefault(); reset(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [file, onClose, goPrev, goNext, zoomIn, zoomOut, rotateRight, reset]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Handle image load to get natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Capture the fitted size after the image loads
    if (fittedSize.width === 0) {
      setFittedSize({ width: img.offsetWidth, height: img.offsetHeight });
    }
  };

  if (!file) return null;

  const mimeType = getMimeType(file.url);
  const fileType = getFileType(mimeType);
  const isImage = fileType === 'image';
  const showNav = files && files.length > 1;

  const download = () => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  // Calculate the displayed image size
  // When rotation is 90 or 270, width and height swap
  const isRotatedSideways = Math.abs(rotation % 180) === 90;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '16px' : '32px',
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        style={{
          backgroundColor: 'rgba(0,0,0,0.95)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          maxWidth: '1000px',
          maxHeight: '700px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
            {showNav && <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>({currentIndex + 1}/{files.length})</span>}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            {formatFileSize(file.size)}
            {isImage && scale !== 1 && ` · ${Math.round(scale * 100)}%`}
            {isImage && rotation !== 0 && ` · ${rotation}°`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconButton onClick={download} title="Download"><Download size={18} /></IconButton>
          <IconButton onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </IconButton>
          <IconButton onClick={onClose} title="Close"><X size={18} /></IconButton>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* Nav arrows */}
        {showNav && (
          <>
            <NavButton direction="left" disabled={!hasPrev} onClick={goPrev} />
            <NavButton direction="right" disabled={!hasNext} onClick={goNext} />
          </>
        )}

        {isImage && (
          <div
            ref={scrollRef}
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: fittedSize.width > 0 ? `${fittedSize.width * scale + 40}px` : '100%',
                minHeight: fittedSize.height > 0 ? `${fittedSize.height * scale + 40}px` : '100%',
                padding: '20px',
                boxSizing: 'border-box',
              }}
            >
              <img
                ref={imageRef}
                src={file.url}
                alt={file.name}
                draggable={false}
                onLoad={handleImageLoad}
                style={{
                  display: 'block',
                  width: fittedSize.width > 0 && scale !== 1 ? `${fittedSize.width * scale}px` : 'auto',
                  height: fittedSize.height > 0 && scale !== 1 ? `${fittedSize.height * scale}px` : 'auto',
                  maxWidth: scale === 1 ? (isRotatedSideways ? 'calc(min(700px, 100vh - 64px) - 180px)' : 'calc(min(1000px, 100vw - 64px) - 80px)') : 'none',
                  maxHeight: scale === 1 ? (isRotatedSideways ? 'calc(min(1000px, 100vw - 64px) - 80px)' : 'calc(min(700px, 100vh - 64px) - 180px)') : 'none',
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
              />
            </div>
          </div>
        )}

        {fileType === 'pdf' && (
          <iframe
            src={file.url}
            title={file.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#525659',
            }}
          />
        )}

        {fileType === 'video' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <video src={file.url} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />
          </div>
        )}

        {fileType === 'audio' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <FileText size={64} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }} />
            <audio src={file.url} controls style={{ width: '100%', maxWidth: '400px' }} />
          </div>
        )}

        {fileType === 'text' && textContent && (
          <pre style={{
            position: 'absolute',
            inset: 0,
            margin: 0,
            padding: '20px',
            overflow: 'auto',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {textContent}
          </pre>
        )}

        {fileType === 'docx' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            backgroundColor: '#525659',
            padding: '20px',
          }}>
            {docxLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
                Loading document...
              </div>
            )}
            {!docxLoading && docxHtml && (
              <div
                dangerouslySetInnerHTML={{ __html: docxHtml }}
                className="docx-preview"
                style={{
                  maxWidth: '816px',
                  minHeight: '1056px',
                  margin: '0 auto',
                  padding: '72px 72px',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  color: '#333',
                  fontSize: `${14 * scale}px`,
                  lineHeight: '1.6',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                }}
              />
            )}
            {!docxLoading && !docxHtml && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
                <FileText size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Could not load document</p>
              </div>
            )}
            <style>{`
              .docx-preview h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
              .docx-preview h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
              .docx-preview h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
              .docx-preview h4 { font-size: 1em; font-weight: bold; margin: 1.33em 0; }
              .docx-preview h5 { font-size: 0.83em; font-weight: bold; margin: 1.67em 0; }
              .docx-preview h6 { font-size: 0.67em; font-weight: bold; margin: 2.33em 0; }
              .docx-preview p { margin: 1em 0; }
              .docx-preview strong, .docx-preview b { font-weight: bold; }
              .docx-preview em, .docx-preview i { font-style: italic; }
              .docx-preview u { text-decoration: underline; }
              .docx-preview ul, .docx-preview ol { margin: 1em 0; padding-left: 2em; }
              .docx-preview li { margin: 0.5em 0; }
              .docx-preview table { border-collapse: collapse; width: 100%; margin: 1em 0; }
              .docx-preview th, .docx-preview td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
              .docx-preview th { background-color: #f5f5f5; font-weight: bold; }
              .docx-preview a { color: #0066cc; text-decoration: underline; }
              .docx-preview img { max-width: 100%; height: auto; }
              .docx-preview blockquote { margin: 1em 0; padding-left: 1em; border-left: 3px solid #ccc; color: #666; }
              .docx-preview pre, .docx-preview code { font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
              .docx-preview pre { padding: 12px; overflow-x: auto; }
            `}</style>
          </div>
        )}

        {fileType === 'unknown' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <FileText size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Preview not available</p>
            <p style={{ fontSize: '14px' }}>Click download to save this file</p>
          </div>
        )}
      </div>

      {/* Image toolbar */}
      {isImage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}>
          <IconButton onClick={zoomOut} title="Zoom out (-)"><ZoomOut size={18} /></IconButton>
          <span style={{ color: '#fff', fontSize: '13px', minWidth: '50px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <IconButton onClick={zoomIn} title="Zoom in (+)"><ZoomIn size={18} /></IconButton>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 8px' }} />
          <IconButton onClick={rotateLeft} title="Rotate left"><RotateCcw size={18} /></IconButton>
          <IconButton onClick={rotateRight} title="Rotate right (R)"><RotateCw size={18} /></IconButton>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 8px' }} />
          <button
            onClick={reset}
            style={{
              padding: '6px 12px',
              backgroundColor: scale === 1 && rotation === 0 ? 'rgba(255,255,255,0.1)' : 'var(--primary, #3b82f6)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Docx toolbar */}
      {fileType === 'docx' && !docxLoading && docxHtml && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}>
          <IconButton onClick={zoomOut} title="Zoom out (-)"><ZoomOut size={18} /></IconButton>
          <span style={{ color: '#fff', fontSize: '13px', minWidth: '50px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <IconButton onClick={zoomIn} title="Zoom in (+)"><ZoomIn size={18} /></IconButton>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 8px' }} />
          <button
            onClick={() => setScale(1)}
            style={{
              padding: '6px 12px',
              backgroundColor: scale === 1 ? 'rgba(255,255,255,0.1)' : 'var(--primary, #3b82f6)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

function IconButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '8px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: '6px',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

function NavButton({ direction, disabled, onClick }: { direction: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'absolute',
        [direction]: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        border: 'none',
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      {direction === 'left' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
    </button>
  );
}

function getMimeType(url: string): string {
  const match = url.match(/^data:([^;,]+)/);
  return match?.[1] || 'application/octet-stream';
}

function getFileType(mime: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'docx' | 'unknown' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (mime.startsWith('text/') || ['application/json', 'application/javascript', 'application/xml'].includes(mime)) return 'text';
  return 'unknown';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
