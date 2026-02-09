'use client';

import { useState, useRef, useEffect } from 'react';
import { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { FileUp, Download, X, ArrowRight, Check } from 'lucide-react';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

interface FileConverterProps {
  theme?: string;
  accentColor?: string;
  glowScale?: number;
  glowOpacity?: string;
}

type InputType =
  | 'image'
  | 'heic'
  | 'word'
  | 'markdown'
  | 'text'
  | 'json'
  | 'csv'
  | 'excel'
  | 'html';

type OutputType =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'pdf'
  | 'text'
  | 'html'
  | 'markdown'
  | 'json'
  | 'csv';

const inputTypes: { value: InputType; label: string }[] = [
  { value: 'image', label: 'Image (JPEG, PNG, WebP, GIF)' },
  { value: 'heic', label: 'HEIC (iPhone Photo)' },
  { value: 'word', label: 'Word Document (.docx)' },
  { value: 'excel', label: 'Excel Spreadsheet (.xlsx)' },
  { value: 'markdown', label: 'Markdown (.md)' },
  { value: 'html', label: 'HTML (.html)' },
  { value: 'text', label: 'Text (.txt)' },
  { value: 'json', label: 'JSON (.json)' },
  { value: 'csv', label: 'CSV (.csv)' },
];

const outputOptions: Record<InputType, { value: OutputType; label: string }[]> = {
  image: [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
    { value: 'pdf', label: 'PDF' },
  ],
  heic: [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
    { value: 'pdf', label: 'PDF' },
  ],
  word: [
    { value: 'text', label: 'Plain Text' },
    { value: 'html', label: 'HTML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'pdf', label: 'PDF' },
  ],
  excel: [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
    { value: 'text', label: 'Plain Text' },
  ],
  markdown: [
    { value: 'html', label: 'HTML' },
    { value: 'pdf', label: 'PDF' },
    { value: 'text', label: 'Plain Text' },
  ],
  html: [
    { value: 'text', label: 'Plain Text' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'pdf', label: 'PDF' },
  ],
  text: [
    { value: 'pdf', label: 'PDF' },
    { value: 'html', label: 'HTML' },
    { value: 'markdown', label: 'Markdown' },
  ],
  json: [
    { value: 'csv', label: 'CSV' },
    { value: 'text', label: 'Formatted Text' },
  ],
  csv: [
    { value: 'json', label: 'JSON' },
    { value: 'text', label: 'Plain Text' },
  ],
};

const acceptedFiles: Record<InputType, string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif,image/bmp',
  heic: '.heic,.HEIC,image/heic',
  word: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  excel: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  markdown: '.md,.markdown,text/markdown',
  html: '.html,.htm,text/html',
  text: '.txt,text/plain',
  json: '.json,application/json',
  csv: '.csv,text/csv',
};

const mimeTypes: Record<OutputType, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  text: 'text/plain',
  html: 'text/html',
  markdown: 'text/markdown',
  json: 'application/json',
  csv: 'text/csv',
};

const extensions: Record<OutputType, string> = {
  jpeg: '.jpg',
  png: '.png',
  webp: '.webp',
  pdf: '.pdf',
  text: '.txt',
  html: '.html',
  markdown: '.md',
  json: '.json',
  csv: '.csv',
};

export default function FileConverter({ theme, accentColor, glowScale = 1, glowOpacity = '80' }: FileConverterProps) {
  const buttonGradient = theme === 'light'
    ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
    : 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)';
  const buttonGlow = accentColor ? `0 0 ${Math.round(12 * glowScale)}px ${accentColor}${glowOpacity}` : undefined;
  const [inputType, setInputType] = useState<InputType>('image');
  const [outputType, setOutputType] = useState<OutputType>('pdf');
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ url: string; filename: string; size?: number }[]>([]);
  const [textResult, setTextResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Simulate progress during conversion, speed based on total file size
  useEffect(() => {
    if (isConverting && files.length > 0) {
      setProgress(0);

      // Adjust speed based on total file size
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      const sizeInMB = totalSize / (1024 * 1024);
      let speedMultiplier: number;
      if (sizeInMB < 0.1) {
        speedMultiplier = 4;
      } else if (sizeInMB < 0.5) {
        speedMultiplier = 2;
      } else if (sizeInMB < 2) {
        speedMultiplier = 1;
      } else if (sizeInMB < 5) {
        speedMultiplier = 0.5;
      } else {
        speedMultiplier = 0.25;
      }

      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) return prev + (8 * speedMultiplier);
          if (prev < 60) return prev + (4 * speedMultiplier);
          if (prev < 85) return prev + (2 * speedMultiplier);
          if (prev < 95) return prev + (0.5 * speedMultiplier);
          return prev;
        });
      }, 100);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (results.length > 0 || textResult) {
        setProgress(100);
      }
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isConverting, files, results, textResult]);

  const handleInputTypeChange = (type: InputType) => {
    setInputType(type);
    setOutputType(outputOptions[type][0].value);
    handleReset();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
      setResults([]);
      setTextResult(null);
      setError(null);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setTextResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getOutputFilename = (originalName: string) => {
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    return baseName + extensions[outputType];
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsConverting(true);
    setError(null);
    setResults([]);
    setTextResult(null);

    try {
      // Image/HEIC to PDF: combine all into one
      if ((inputType === 'image' || inputType === 'heic') && outputType === 'pdf') {
        await convertImagesToPdf(files, inputType === 'heic');
      }
      // All other conversions: process each file
      else {
        const newResults: { url: string; filename: string; size?: number }[] = [];

        for (const f of files) {
          const filename = getOutputFilename(f.name);

          if (inputType === 'image') {
            const result = await convertImageFormatSingle(f, outputType);
            newResults.push({ ...result, filename });
          } else if (inputType === 'heic') {
            const result = await convertHeicSingle(f, outputType);
            newResults.push({ ...result, filename });
          } else if (inputType === 'word') {
            const result = await convertWordSingle(f, outputType, filename);
            if (result) newResults.push(result);
          } else if (inputType === 'excel') {
            const result = await convertExcelSingle(f, outputType, filename);
            if (result) newResults.push(result);
          } else if (inputType === 'markdown') {
            const result = await convertMarkdownSingle(f, outputType, filename);
            if (result) newResults.push(result);
          } else if (inputType === 'html') {
            const result = await convertHtmlSingle(f, outputType, filename);
            if (result) newResults.push(result);
          } else if (inputType === 'text') {
            const result = await convertTextSingle(f, outputType, filename);
            if (result) newResults.push(result);
          } else if (inputType === 'json') {
            const result = await convertJsonSingle(f, outputType, filename);
            if (result) newResults.push(result);
          } else if (inputType === 'csv') {
            const result = await convertCsvSingle(f, outputType, filename);
            if (result) newResults.push(result);
          }
        }

        if (newResults.length > 0) {
          setResults(newResults);
        }
      }
    } catch (err: unknown) {
      console.error('Conversion error:', err);
      let message = 'Conversion failed. Please try again.';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String((err as { message: unknown }).message);
      } else if (typeof err === 'string') {
        message = err;
      }
      setError(message);
    } finally {
      setIsConverting(false);
    }
  };

  const convertImagesToPdf = async (imageFiles: File[], isHeic: boolean) => {
    const { default: jsPDF } = await import('jspdf');

    // Convert all files to image blobs
    const imageBlobs: Blob[] = [];
    for (const f of imageFiles) {
      if (isHeic) {
        // Convert HEIC via server
        const formData = new FormData();
        formData.append('file', f);
        formData.append('format', 'PNG');
        const response = await fetch('/api/convert/heic', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Failed to convert HEIC image');
        const { data, mimeType } = await response.json();
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        imageBlobs.push(new Blob([bytes], { type: mimeType }));
      } else {
        imageBlobs.push(f);
      }
    }

    // Load first image to initialize PDF
    const firstImg = await loadImage(imageBlobs[0]);
    const pdf = new jsPDF({
      orientation: firstImg.width > firstImg.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [firstImg.width, firstImg.height],
    });
    pdf.addImage(firstImg, 'PNG', 0, 0, firstImg.width, firstImg.height);
    URL.revokeObjectURL(firstImg.src);

    // Add remaining images
    for (let i = 1; i < imageBlobs.length; i++) {
      const img = await loadImage(imageBlobs[i]);
      pdf.addPage([img.width, img.height], img.width > img.height ? 'landscape' : 'portrait');
      pdf.addImage(img, 'PNG', 0, 0, img.width, img.height);
      URL.revokeObjectURL(img.src);
    }

    const blob = pdf.output('blob');
    const filename = imageFiles.length > 1 ? 'combined.pdf' : getOutputFilename(imageFiles[0].name);
    setResults([{ url: URL.createObjectURL(blob), filename, size: blob.size }]);
  };

  const convertHeicSingle = async (file: File, output: OutputType): Promise<{ url: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', output === 'png' ? 'PNG' : 'JPEG');

    const response = await fetch('/api/convert/heic', { method: 'POST', body: formData });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to convert HEIC image');
    }

    const { data, mimeType } = await response.json();
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    let blob = new Blob([bytes], { type: mimeType });

    // Convert to WebP if needed
    if (output === 'webp') {
      const img = await loadImage(blob);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed'))), 'image/webp', 0.92);
      });
    }

    return { url: URL.createObjectURL(blob), size: blob.size };
  };

  const convertImageFormatSingle = async (file: File, format: OutputType): Promise<{ url: string; size: number }> => {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    URL.revokeObjectURL(img.src);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed'))), mimeTypes[format], 0.92);
    });
    return { url: URL.createObjectURL(blob), size: blob.size };
  };

  const loadImage = (blob: Blob): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  };

  const convertWordSingle = async (file: File, output: OutputType, filename: string): Promise<{ url: string; filename: string; size: number } | null> => {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();

    if (output === 'text') {
      const result = await mammoth.extractRawText({ arrayBuffer });
      setTextResult(result.value);
      return null;
    } else if (output === 'html') {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const blob = new Blob([result.value], { type: mimeTypes.html });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    } else if (output === 'markdown') {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const markdown = htmlToMarkdown(result.value);
      const blob = new Blob([markdown], { type: mimeTypes.markdown });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    } else if (output === 'pdf') {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return await textToPdfSingle(result.value, filename);
    }
    return null;
  };

  const convertExcelSingle = async (file: File, output: OutputType, filename: string): Promise<{ url: string; filename: string; size: number } | null> => {
    const readXlsxFile = (await import('read-excel-file')).default;
    const rows = await readXlsxFile(file);

    if (output === 'csv') {
      const csv = rows.map(row =>
        row.map(cell => {
          const str = String(cell ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(',')
      ).join('\n');
      const blob = new Blob([csv], { type: mimeTypes.csv });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    } else if (output === 'json') {
      const headers = rows[0] as string[];
      const data = rows.slice(1).map(row => {
        const obj: Record<string, unknown> = {};
        headers.forEach((header, i) => {
          obj[String(header)] = row[i];
        });
        return obj;
      });
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: mimeTypes.json });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    } else if (output === 'text') {
      const text = rows.map(row => row.join('\t')).join('\n');
      setTextResult(text);
      return null;
    }
    return null;
  };

  const convertMarkdownSingle = async (file: File, output: OutputType, filename: string): Promise<{ url: string; filename: string; size: number } | null> => {
    const text = await file.text();
    const { marked } = await import('marked');

    if (output === 'html') {
      const html = await marked(text);
      const fullHtml = `<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8"><title>${file.name}</title></head>\n<body>${html}</body>\n</html>`;
      const blob = new Blob([fullHtml], { type: mimeTypes.html });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    } else if (output === 'pdf') {
      return await textToPdfSingle(text, filename);
    } else if (output === 'text') {
      const plainText = text
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1');
      setTextResult(plainText);
      return null;
    }
    return null;
  };

  const convertHtmlSingle = async (file: File, output: OutputType, filename: string): Promise<{ url: string; filename: string; size: number } | null> => {
    const html = await file.text();

    if (output === 'text') {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      setTextResult(doc.body.textContent || '');
      return null;
    } else if (output === 'markdown') {
      const markdown = htmlToMarkdown(html);
      const blob = new Blob([markdown], { type: mimeTypes.markdown });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    } else if (output === 'pdf') {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return await textToPdfSingle(doc.body.textContent || '', filename);
    }
    return null;
  };

  const convertTextSingle = async (file: File, output: OutputType, filename: string): Promise<{ url: string; filename: string; size: number } | null> => {
    const text = await file.text();

    if (output === 'pdf') {
      return await textToPdfSingle(text, filename);
    } else if (output === 'html') {
      const html = `<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8"><title>${file.name}</title></head>\n<body><pre>${escapeHtml(text)}</pre></body>\n</html>`;
      const blob = new Blob([html], { type: mimeTypes.html });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    } else if (output === 'markdown') {
      const blob = new Blob([text], { type: mimeTypes.markdown });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    }
    return null;
  };

  const convertJsonSingle = async (file: File, output: OutputType, filename: string): Promise<{ url: string; filename: string; size: number } | null> => {
    const text = await file.text();
    const data = JSON.parse(text);

    if (output === 'csv') {
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of objects to convert to CSV');
      }
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(','),
        ...data.map((row: Record<string, unknown>) =>
          headers.map(h => {
            const val = String(row[h] ?? '');
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: mimeTypes.csv });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    } else if (output === 'text') {
      setTextResult(JSON.stringify(data, null, 2));
      return null;
    }
    return null;
  };

  const convertCsvSingle = async (file: File, output: OutputType, filename: string): Promise<{ url: string; filename: string; size: number } | null> => {
    const text = await file.text();
    const rows = parseCsv(text);

    if (output === 'json') {
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: mimeTypes.json });
      return { url: URL.createObjectURL(blob), filename, size: blob.size };
    } else if (output === 'text') {
      const formatted = rows.map(row => row.join('\t')).join('\n');
      setTextResult(formatted);
      return null;
    }
    return null;
  };

  const textToPdfSingle = async (text: string, filename: string): Promise<{ url: string; filename: string; size: number }> => {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 14;
    let y = margin;

    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(text, maxWidth);

    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }

    const blob = pdf.output('blob');
    return { url: URL.createObjectURL(blob), filename, size: blob.size };
  };

  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentCell += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentCell);
          currentCell = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          if (char === '\r') i++;
        } else if (char !== '\r') {
          currentCell += char;
        }
      }
    }

    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    return rows;
  };

  const copyToClipboard = async () => {
    if (textResult) {
      await navigator.clipboard.writeText(textResult);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Selectors Row */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            From
          </label>
          <Select
            value={inputType}
            onChange={(e) => handleInputTypeChange(e.target.value as InputType)}
            options={inputTypes}
          />
        </div>
        <div style={{ padding: '10px 0' }}>
          <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            To
          </label>
          <Select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value as OutputType)}
            options={outputOptions[inputType]}
          />
        </div>
      </div>

      {/* File Input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFiles[inputType]}
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          style={{ width: '100%' }}
        >
          <FileUp size={18} />
          {files.length > 0 ? 'Add More Files' : 'Select Files'}
        </Button>
      </div>

      {/* File Cards */}
      {files.length > 0 && results.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {files.map((f, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                padding: '10px 12px',
                backgroundColor: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {/* Progress bar background - only show on first file during conversion */}
              {isConverting && index === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: 'var(--accent-bg, rgba(99, 102, 241, 0.1))',
                    transition: 'width 0.1s ease-out',
                  }}
                />
              )}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.name}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {formatFileSize(f.size)}
                </span>
                {isConverting && index === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--link)', fontWeight: 500, flexShrink: 0, minWidth: '32px', textAlign: 'right' }}>
                    {Math.round(progress)}%
                  </span>
                ) : !isConverting && (
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      padding: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      borderRadius: '4px',
                      display: 'flex',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {/* Total size indicator for multiple files */}
          {files.length > 1 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '4px' }}>
              {files.length} files · {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))} total
            </div>
          )}
        </div>
      )}

      {/* Converted File Cards */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    backgroundColor: 'var(--success, #22c55e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Check size={14} style={{ color: 'white' }} />
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {result.filename}
                </span>
                {result.size && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {formatFileSize(result.size)}
                  </span>
                )}
                <a
                  href={result.url}
                  download={result.filename}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: accentColor || 'var(--link)',
                    backgroundImage: buttonGradient,
                    boxShadow: buttonGlow,
                    color: 'var(--accent-text)',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  <Download size={12} />
                  Download
                </a>
              </div>
            </div>
          ))}
          {/* Clear button for results */}
          <Button variant="secondary" onClick={handleReset} style={{ marginTop: '4px' }}>
            <X size={16} />
            Clear
          </Button>
        </div>
      )}

      {/* Convert Button */}
      {files.length > 0 && results.length === 0 && !textResult && !isConverting && (
        <Button onClick={handleConvert}>
          Convert to {outputOptions[inputType].find(o => o.value === outputType)?.label}
        </Button>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
            border: '1px solid var(--danger, #ef4444)',
            borderRadius: '8px',
            color: 'var(--danger, #ef4444)',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Text Result */}
      {textResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              maxHeight: '250px',
              overflow: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'inherit',
              }}
            >
              {textResult}
            </pre>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={copyToClipboard} style={{ flex: 1 }}>
              Copy to Clipboard
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && results.length === 0 && !textResult && (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <FileUp size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            {(inputType === 'image' || inputType === 'heic') && outputType === 'pdf'
              ? `Select images to combine into a PDF.`
              : `Select files to convert to ${outputOptions[inputType].find(o => o.value === outputType)?.label}.`
            }
          </p>
        </div>
      )}

    </div>
  );
}
