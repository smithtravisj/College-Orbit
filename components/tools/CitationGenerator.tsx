'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Input';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Copy, Check } from 'lucide-react';

interface CitationGeneratorProps {
  theme?: string;
}

type CitationStyle = 'apa' | 'mla' | 'chicago';
type SourceType = 'website' | 'book' | 'journal';

interface CitationData {
  // Common fields
  authors: string;
  title: string;
  year: string;
  // Website fields
  websiteName: string;
  url: string;
  accessDate: string;
  // Book fields
  publisher: string;
  publisherLocation: string;
  edition: string;
  // Journal fields
  journalName: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
}

const defaultData: CitationData = {
  authors: '',
  title: '',
  year: '',
  websiteName: '',
  url: '',
  accessDate: new Date().toISOString().split('T')[0],
  publisher: '',
  publisherLocation: '',
  edition: '',
  journalName: '',
  volume: '',
  issue: '',
  pages: '',
  doi: '',
};

const styleOptions = [
  { value: 'apa', label: 'APA (7th Edition)' },
  { value: 'mla', label: 'MLA (9th Edition)' },
  { value: 'chicago', label: 'Chicago (17th Edition)' },
];

const sourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'book', label: 'Book' },
  { value: 'journal', label: 'Journal Article' },
];

function formatAuthorsAPA(authors: string): string {
  if (!authors.trim()) return '';
  const authorList = authors.split(',').map(a => a.trim()).filter(a => a);
  if (authorList.length === 0) return '';

  const formatted = authorList.map(author => {
    const parts = author.split(' ').filter(p => p);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join(' ');
    return `${lastName}, ${initials}`;
  });

  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  if (formatted.length > 20) {
    return `${formatted.slice(0, 19).join(', ')}, ... ${formatted[formatted.length - 1]}`;
  }
  return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
}

function formatAuthorsMLA(authors: string): string {
  if (!authors.trim()) return '';
  const authorList = authors.split(',').map(a => a.trim()).filter(a => a);
  if (authorList.length === 0) return '';

  const formatSingle = (author: string, invert: boolean) => {
    const parts = author.split(' ').filter(p => p);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return invert ? `${lastName}, ${firstName}` : `${firstName} ${lastName}`;
  };

  if (authorList.length === 1) return formatSingle(authorList[0], true);
  if (authorList.length === 2) {
    return `${formatSingle(authorList[0], true)}, and ${formatSingle(authorList[1], false)}`;
  }
  return `${formatSingle(authorList[0], true)}, et al.`;
}

function formatAuthorsChicago(authors: string): string {
  if (!authors.trim()) return '';
  const authorList = authors.split(',').map(a => a.trim()).filter(a => a);
  if (authorList.length === 0) return '';

  const formatSingle = (author: string, invert: boolean) => {
    const parts = author.split(' ').filter(p => p);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return invert ? `${lastName}, ${firstName}` : `${firstName} ${lastName}`;
  };

  if (authorList.length === 1) return formatSingle(authorList[0], true);
  if (authorList.length === 2) {
    return `${formatSingle(authorList[0], true)}, and ${formatSingle(authorList[1], false)}`;
  }
  if (authorList.length === 3) {
    return `${formatSingle(authorList[0], true)}, ${formatSingle(authorList[1], false)}, and ${formatSingle(authorList[2], false)}`;
  }
  return `${formatSingle(authorList[0], true)}, et al.`;
}

function formatDate(dateStr: string, style: CitationStyle): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsShort = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

  if (style === 'apa') {
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } else if (style === 'mla') {
    return `${date.getDate()} ${monthsShort[date.getMonth()]} ${date.getFullYear()}`;
  } else {
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
}

function generateCitation(data: CitationData, style: CitationStyle, sourceType: SourceType): string {
  const { authors, title, year, websiteName, url, accessDate, publisher, publisherLocation, edition, journalName, volume, issue, pages, doi } = data;

  if (sourceType === 'website') {
    if (style === 'apa') {
      const authorPart = authors ? `${formatAuthorsAPA(authors)} ` : '';
      const yearPart = year ? `(${year}). ` : '(n.d.). ';
      const titlePart = title ? `${title}. ` : '';
      const sitePart = websiteName ? `${websiteName}. ` : '';
      const urlPart = url ? url : '';
      return `${authorPart}${yearPart}${titlePart}${sitePart}${urlPart}`;
    } else if (style === 'mla') {
      const authorPart = authors ? `${formatAuthorsMLA(authors)}. ` : '';
      const titlePart = title ? `"${title}." ` : '';
      const sitePart = websiteName ? `*${websiteName}*, ` : '';
      const yearPart = year ? `${year}, ` : '';
      const urlPart = url ? `${url}. ` : '';
      const accessPart = accessDate ? `Accessed ${formatDate(accessDate, 'mla')}.` : '';
      return `${authorPart}${titlePart}${sitePart}${yearPart}${urlPart}${accessPart}`;
    } else {
      const authorPart = authors ? `${formatAuthorsChicago(authors)}. ` : '';
      const titlePart = title ? `"${title}." ` : '';
      const sitePart = websiteName ? `${websiteName}. ` : '';
      const accessPart = accessDate ? `Accessed ${formatDate(accessDate, 'chicago')}. ` : '';
      const urlPart = url ? `${url}.` : '';
      return `${authorPart}${titlePart}${sitePart}${accessPart}${urlPart}`;
    }
  } else if (sourceType === 'book') {
    if (style === 'apa') {
      const authorPart = authors ? `${formatAuthorsAPA(authors)} ` : '';
      const yearPart = year ? `(${year}). ` : '(n.d.). ';
      const titlePart = title ? `*${title}*${edition ? ` (${edition} ed.)` : ''}. ` : '';
      const pubPart = publisher ? `${publisher}.` : '';
      return `${authorPart}${yearPart}${titlePart}${pubPart}`;
    } else if (style === 'mla') {
      const authorPart = authors ? `${formatAuthorsMLA(authors)}. ` : '';
      const titlePart = title ? `*${title}*. ` : '';
      const edPart = edition ? `${edition} ed., ` : '';
      const pubPart = publisher ? `${publisher}, ` : '';
      const yearPart = year ? `${year}.` : '';
      return `${authorPart}${titlePart}${edPart}${pubPart}${yearPart}`;
    } else {
      const authorPart = authors ? `${formatAuthorsChicago(authors)}. ` : '';
      const titlePart = title ? `*${title}*. ` : '';
      const edPart = edition ? `${edition} ed. ` : '';
      const locPart = publisherLocation ? `${publisherLocation}: ` : '';
      const pubPart = publisher ? `${publisher}, ` : '';
      const yearPart = year ? `${year}.` : '';
      return `${authorPart}${titlePart}${edPart}${locPart}${pubPart}${yearPart}`;
    }
  } else {
    // Journal
    if (style === 'apa') {
      const authorPart = authors ? `${formatAuthorsAPA(authors)} ` : '';
      const yearPart = year ? `(${year}). ` : '(n.d.). ';
      const titlePart = title ? `${title}. ` : '';
      const journalPart = journalName ? `*${journalName}*` : '';
      const volPart = volume ? `, *${volume}*` : '';
      const issuePart = issue ? `(${issue})` : '';
      const pagesPart = pages ? `, ${pages}` : '';
      const doiPart = doi ? `. https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//, '')}` : '';
      return `${authorPart}${yearPart}${titlePart}${journalPart}${volPart}${issuePart}${pagesPart}${doiPart}`;
    } else if (style === 'mla') {
      const authorPart = authors ? `${formatAuthorsMLA(authors)}. ` : '';
      const titlePart = title ? `"${title}." ` : '';
      const journalPart = journalName ? `*${journalName}*, ` : '';
      const volPart = volume ? `vol. ${volume}, ` : '';
      const issuePart = issue ? `no. ${issue}, ` : '';
      const yearPart = year ? `${year}, ` : '';
      const pagesPart = pages ? `pp. ${pages}.` : '';
      return `${authorPart}${titlePart}${journalPart}${volPart}${issuePart}${yearPart}${pagesPart}`;
    } else {
      const authorPart = authors ? `${formatAuthorsChicago(authors)}. ` : '';
      const titlePart = title ? `"${title}." ` : '';
      const journalPart = journalName ? `*${journalName}* ` : '';
      const volPart = volume ? `${volume}` : '';
      const issuePart = issue ? `, no. ${issue}` : '';
      const yearPart = year ? ` (${year})` : '';
      const pagesPart = pages ? `: ${pages}` : '';
      return `${authorPart}${titlePart}${journalPart}${volPart}${issuePart}${yearPart}${pagesPart}.`;
    }
  }
}

export default function CitationGenerator({ theme: _theme }: CitationGeneratorProps) {
  const [style, setStyle] = useState<CitationStyle>('apa');
  const [sourceType, setSourceType] = useState<SourceType>('website');
  const [data, setData] = useState<CitationData>(defaultData);
  const [copied, setCopied] = useState(false);

  const updateField = (field: keyof CitationData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const citation = generateCitation(data, style, sourceType);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setData(defaultData);
  };

  const renderFields = () => {
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' } as const;

    if (sourceType === 'website') {
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Author(s) <span style={{ fontWeight: 400, fontSize: '11px' }}>(comma-separated)</span></label>
              <Input
                value={data.authors}
                onChange={(e) => updateField('authors', e.target.value)}
                placeholder="John Smith, Jane Doe"
              />
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <Input
                value={data.year}
                onChange={(e) => updateField('year', e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <Input
                value={data.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Title of the article"
              />
            </div>
            <div>
              <label style={labelStyle}>Website Name</label>
              <Input
                value={data.websiteName}
                onChange={(e) => updateField('websiteName', e.target.value)}
                placeholder="Example Website"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>URL</label>
              <Input
                value={data.url}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://example.com/article"
              />
            </div>
            <div>
              <label style={labelStyle}>Access Date</label>
              <Input
                type="date"
                value={data.accessDate}
                onChange={(e) => updateField('accessDate', e.target.value)}
              />
            </div>
          </div>
        </>
      );
    } else if (sourceType === 'book') {
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Author(s) <span style={{ fontWeight: 400, fontSize: '11px' }}>(comma-separated)</span></label>
              <Input
                value={data.authors}
                onChange={(e) => updateField('authors', e.target.value)}
                placeholder="John Smith, Jane Doe"
              />
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <Input
                value={data.year}
                onChange={(e) => updateField('year', e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Title</label>
            <Input
              value={data.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Title of the book"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: style === 'chicago' ? '1fr 1fr 1fr' : '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Publisher</label>
              <Input
                value={data.publisher}
                onChange={(e) => updateField('publisher', e.target.value)}
                placeholder="Publisher Name"
              />
            </div>
            {style === 'chicago' && (
              <div>
                <label style={labelStyle}>Location</label>
                <Input
                  value={data.publisherLocation}
                  onChange={(e) => updateField('publisherLocation', e.target.value)}
                  placeholder="New York"
                />
              </div>
            )}
            <div>
              <label style={labelStyle}>Edition</label>
              <Input
                value={data.edition}
                onChange={(e) => updateField('edition', e.target.value)}
                placeholder="2nd"
              />
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Author(s) <span style={{ fontWeight: 400, fontSize: '11px' }}>(comma-separated)</span></label>
              <Input
                value={data.authors}
                onChange={(e) => updateField('authors', e.target.value)}
                placeholder="John Smith, Jane Doe"
              />
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <Input
                value={data.year}
                onChange={(e) => updateField('year', e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Article Title</label>
              <Input
                value={data.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Title of the article"
              />
            </div>
            <div>
              <label style={labelStyle}>Journal Name</label>
              <Input
                value={data.journalName}
                onChange={(e) => updateField('journalName', e.target.value)}
                placeholder="Journal of Example Studies"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Volume</label>
              <Input
                value={data.volume}
                onChange={(e) => updateField('volume', e.target.value)}
                placeholder="12"
              />
            </div>
            <div>
              <label style={labelStyle}>Issue</label>
              <Input
                value={data.issue}
                onChange={(e) => updateField('issue', e.target.value)}
                placeholder="3"
              />
            </div>
            <div>
              <label style={labelStyle}>Pages</label>
              <Input
                value={data.pages}
                onChange={(e) => updateField('pages', e.target.value)}
                placeholder="45-67"
              />
            </div>
            <div>
              <label style={labelStyle}>DOI</label>
              <Input
                value={data.doi}
                onChange={(e) => updateField('doi', e.target.value)}
                placeholder="10.1234/example"
              />
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Style and Source Type Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Citation Style
          </label>
          <Select
            value={style}
            onChange={(e) => setStyle(e.target.value as CitationStyle)}
            options={styleOptions}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Source Type
          </label>
          <Select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
            options={sourceOptions}
          />
        </div>
      </div>

      {/* Dynamic Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {renderFields()}
      </div>

      {/* Generated Citation */}
      {citation && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Generated Citation
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--text)',
              lineHeight: 1.6,
              fontFamily: 'Georgia, serif',
            }}
            dangerouslySetInnerHTML={{
              __html: citation
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            }}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCopy}
          disabled={!citation}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy Citation'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
