'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import useAppStore from '@/lib/store';
import { marked } from 'marked';

// Heavy dependencies are dynamically imported when needed
// mammoth - for .docx files
// read-excel-file - for .xlsx files
// jszip - for .pptx files

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
  const enableKeyboardShortcuts = useAppStore((state) => state.settings.enableKeyboardShortcuts) ?? true;
  const [mounted, setMounted] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [xlsxData, setXlsxData] = useState<string[][] | null>(null);
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [markdownHtml, setMarkdownHtml] = useState<string | null>(null);
  const [pptxSlides, setPptxSlides] = useState<string[] | null>(null);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fittedSize, setFittedSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const hasPrev = files && files.length > 1 && currentIndex > 0;
  const hasNext = files && files.length > 1 && currentIndex < files.length - 1;

  // Mount state for portal SSR compatibility
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Load docx content (mammoth loaded on demand)
  useEffect(() => {
    if (!file) return;
    const mimeType = getMimeType(file.url);
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setDocxLoading(true);
      setDocxHtml(null);

      const loadDocx = async () => {
        try {
          const mammoth = await import('mammoth');
          const base64Data = file.url.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
          setDocxHtml(result.value);
          setDocxLoading(false);
        } catch {
          setDocxHtml(null);
          setDocxLoading(false);
        }
      };

      loadDocx();
    } else {
      setDocxHtml(null);
    }
  }, [file]);

  // Load xlsx content (read-excel-file loaded on demand)
  useEffect(() => {
    if (!file) return;
    const mimeType = getMimeType(file.url);
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setXlsxLoading(true);
      setXlsxData(null);

      const loadXlsx = async () => {
        try {
          const readXlsxFile = (await import('read-excel-file')).default;
          const base64Data = file.url.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const rows = await readXlsxFile(blob);
          // Convert all cell values to strings for display
          const stringRows = rows.map(row => row.map(cell => cell !== null && cell !== undefined ? String(cell) : ''));
          setXlsxData(stringRows);
          setXlsxLoading(false);
        } catch {
          setXlsxData(null);
          setXlsxLoading(false);
        }
      };

      loadXlsx();
    } else {
      setXlsxData(null);
    }
  }, [file]);

  // Load CSV content
  useEffect(() => {
    if (!file) return;
    const mimeType = getMimeType(file.url);
    if (mimeType === 'text/csv' || mimeType === 'application/csv') {
      try {
        const base64Data = file.url.split(',')[1];
        const text = atob(base64Data);
        const rows = parseCSV(text);
        setCsvData(rows);
      } catch {
        setCsvData(null);
      }
    } else {
      setCsvData(null);
    }
  }, [file]);

  // Load markdown content
  useEffect(() => {
    if (!file) return;
    const mimeType = getMimeType(file.url);
    const isMarkdown = mimeType === 'text/markdown' || mimeType === 'text/x-markdown' || file.name.toLowerCase().endsWith('.md');
    if (isMarkdown) {
      try {
        const base64Data = file.url.split(',')[1];
        const text = atob(base64Data);
        const html = marked(text, { gfm: true, breaks: true }) as string;
        setMarkdownHtml(html);
      } catch {
        setMarkdownHtml(null);
      }
    } else {
      setMarkdownHtml(null);
    }
  }, [file]);

  // Load PPTX content (jszip loaded on demand)
  useEffect(() => {
    if (!file) return;
    const mimeType = getMimeType(file.url);
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      setPptxLoading(true);
      setPptxSlides(null);

      const loadPptx = async () => {
        try {
          const JSZip = (await import('jszip')).default;
          const base64Data = file.url.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const zip = await JSZip.loadAsync(bytes);
          const slides: string[] = [];

          // Find all slide files
          const slideFiles = Object.keys(zip.files)
            .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
            .sort((a, b) => {
              const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
              const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
              return numA - numB;
            });

          for (const slideFile of slideFiles) {
            const content = await zip.files[slideFile].async('text');
            // Extract text from <a:t> tags
            const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g) || [];
            const slideText = textMatches
              .map(match => match.replace(/<\/?a:t>/g, ''))
              .filter(text => text.trim())
              .join('\n');
            slides.push(slideText || '(No text content)');
          }

          setPptxSlides(slides.length > 0 ? slides : ['No slides found']);
          setPptxLoading(false);
        } catch {
          setPptxSlides(null);
          setPptxLoading(false);
        }
      };

      loadPptx();
    } else {
      setPptxSlides(null);
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
    const elem = containerRef.current;
    if (!elem) return;

    // Check if already in fullscreen
    const fullscreenElement = document.fullscreenElement || (document as any).webkitFullscreenElement;

    if (fullscreenElement) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } else {
      // Enter fullscreen with cross-browser support
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Escape always works to close the modal
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Other shortcuts only work if keyboard shortcuts are enabled
      if (!enableKeyboardShortcuts) return;
      switch (e.key) {
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
  }, [file, onClose, goPrev, goNext, zoomIn, zoomOut, rotateRight, reset, enableKeyboardShortcuts]);

  // Fullscreen change listener (with Safari support)
  useEffect(() => {
    const handler = () => {
      const fullscreenElement = document.fullscreenElement || (document as any).webkitFullscreenElement;
      setIsFullscreen(!!fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  // Handle image load to get natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Capture the fitted size after the image loads
    if (fittedSize.width === 0) {
      setFittedSize({ width: img.offsetWidth, height: img.offsetHeight });
    }
  };

  if (!file || !mounted) return null;

  const mimeType = getMimeType(file.url);
  const fileType = getFileType(mimeType, file.name);
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

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
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

        {fileType === 'xlsx' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            backgroundColor: '#525659',
            padding: '20px',
          }}>
            {xlsxLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
                Loading spreadsheet...
              </div>
            )}
            {!xlsxLoading && xlsxData && (
              <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '4px',
                fontSize: `${13 * scale}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    {xlsxData.map((row, rowIndex) => (
                      <tr key={rowIndex} style={{ backgroundColor: rowIndex === 0 ? '#f5f5f5' : rowIndex % 2 === 0 ? '#fafafa' : '#fff' }}>
                        {row.map((cell, cellIndex) => (
                          rowIndex === 0 ? (
                            <th key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', fontWeight: 'bold' }}>{cell}</th>
                          ) : (
                            <td key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left' }}>{cell}</td>
                          )
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!xlsxLoading && !xlsxData && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
                <FileText size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Could not load spreadsheet</p>
              </div>
            )}
          </div>
        )}

        {fileType === 'csv' && csvData && (
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            backgroundColor: '#525659',
            padding: '20px',
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              fontSize: `${13 * scale}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                  {csvData.map((row, rowIndex) => (
                    <tr key={rowIndex} style={{ backgroundColor: rowIndex === 0 ? '#f5f5f5' : rowIndex % 2 === 0 ? '#fafafa' : '#fff' }}>
                      {row.map((cell, cellIndex) => (
                        rowIndex === 0 ? (
                          <th key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', fontWeight: 'bold' }}>{cell}</th>
                        ) : (
                          <td key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left' }}>{cell}</td>
                        )
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {fileType === 'markdown' && markdownHtml && (
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            backgroundColor: '#525659',
            padding: '20px',
          }}>
            <div
              dangerouslySetInnerHTML={{ __html: markdownHtml }}
              className="markdown-preview"
              style={{
                maxWidth: '816px',
                minHeight: '100%',
                margin: '0 auto',
                padding: '40px 48px',
                backgroundColor: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                color: '#333',
                fontSize: `${15 * scale}px`,
                lineHeight: '1.6',
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
              }}
            />
            <style>{`
              .markdown-preview h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
              .markdown-preview h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
              .markdown-preview h3 { font-size: 1.25em; font-weight: bold; margin: 1em 0; }
              .markdown-preview h4 { font-size: 1em; font-weight: bold; margin: 1.33em 0; }
              .markdown-preview h5 { font-size: 0.875em; font-weight: bold; margin: 1.67em 0; }
              .markdown-preview h6 { font-size: 0.85em; font-weight: bold; margin: 2.33em 0; color: #666; }
              .markdown-preview p { margin: 1em 0; }
              .markdown-preview strong, .markdown-preview b { font-weight: bold; }
              .markdown-preview em, .markdown-preview i { font-style: italic; }
              .markdown-preview ul, .markdown-preview ol { margin: 1em 0; padding-left: 2em; }
              .markdown-preview li { margin: 0.25em 0; }
              .markdown-preview table { border-collapse: collapse; width: 100%; margin: 1em 0; }
              .markdown-preview th, .markdown-preview td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
              .markdown-preview th { background-color: #f5f5f5; font-weight: bold; }
              .markdown-preview a { color: #0066cc; text-decoration: underline; }
              .markdown-preview blockquote { margin: 1em 0; padding: 0.5em 1em; border-left: 4px solid #ddd; color: #666; background: #f9f9f9; }
              .markdown-preview pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 1em 0; }
              .markdown-preview code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.9em; }
              .markdown-preview p code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
              .markdown-preview hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
              .markdown-preview img { max-width: 100%; height: auto; }
            `}</style>
          </div>
        )}

        {fileType === 'pptx' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
            backgroundColor: '#2d2d2d',
            padding: '20px',
          }}>
            {pptxLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
                Loading presentation...
              </div>
            )}
            {!pptxLoading && pptxSlides && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
                {pptxSlides.map((slideText, index) => (
                  <div key={index} style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      backgroundColor: '#4a5568',
                      color: '#fff',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}>
                      Slide {index + 1}
                    </div>
                    <div style={{
                      padding: '24px',
                      minHeight: '120px',
                      whiteSpace: 'pre-wrap',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#333',
                    }}>
                      {slideText}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!pptxLoading && !pptxSlides && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
                <FileText size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Could not load presentation</p>
              </div>
            )}
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

      {/* XLSX toolbar */}
      {fileType === 'xlsx' && !xlsxLoading && xlsxData && (
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

      {/* CSV toolbar */}
      {fileType === 'csv' && csvData && (
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

      {/* Markdown toolbar */}
      {fileType === 'markdown' && markdownHtml && (
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

  return createPortal(modalContent, document.body);
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

function getFileType(mime: string, fileName?: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'docx' | 'xlsx' | 'pptx' | 'markdown' | 'csv' | 'unknown' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
  if (mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
  if (mime === 'text/csv' || mime === 'application/csv') return 'csv';
  if (mime === 'text/markdown' || mime === 'text/x-markdown') return 'markdown';
  // Check file extension for markdown files (browsers often report as text/plain)
  if (fileName && fileName.toLowerCase().endsWith('.md')) return 'markdown';
  if (mime.startsWith('text/') || ['application/json', 'application/javascript', 'application/xml'].includes(mime)) return 'text';
  return 'unknown';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}
