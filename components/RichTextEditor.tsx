'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Link as LinkIcon, Heading1, Heading2, List, ListOrdered, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './RichTextEditor.module.css';

interface RichTextEditorProps {
  value: any; // TipTap JSON content
  onChange: (content: any) => void;
  className?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  className = '',
  readOnly = false,
}: RichTextEditorProps) {
  const [, setUpdateCount] = useState(0);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {},
        },
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          HTMLAttributes: {},
        },
        orderedList: {
          HTMLAttributes: {},
        },
        codeBlock: {
          HTMLAttributes: {},
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      CharacterCount.configure({
        limit: undefined,
      }),
      Placeholder.configure({
        placeholder: 'Click here and start typing your note...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value || { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
      setUpdateCount(c => c + 1);
    },
    editable: !readOnly,
  });

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setUpdateCount(c => c + 1);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    editor.on('focus', handleFocus);
    editor.on('blur', handleBlur);
    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      editor.off('focus', handleFocus);
      editor.off('blur', handleBlur);
    };
  }, [editor]);

  if (!editor) {
    return <div className="text-[var(--text-muted)]">Loading editor...</div>;
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap gap-2 bg-[var(--panel-2)] rounded-lg border border-[var(--border)] overflow-x-auto" style={{ padding: '8px' }}>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            icon={<Bold size={18} />}
            title="Bold"
            onToolbarChange={() => setUpdateCount(c => c + 1)}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            icon={<Italic size={18} />}
            title="Italic"
            onToolbarChange={() => setUpdateCount(c => c + 1)}
          />
          <div className="w-px bg-[var(--border)]" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            icon={<Heading1 size={18} />}
            title="Heading 1"
            onToolbarChange={() => setUpdateCount(c => c + 1)}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            icon={<Heading2 size={18} />}
            title="Heading 2"
            onToolbarChange={() => setUpdateCount(c => c + 1)}
          />
          <div className="w-px bg-[var(--border)]" />
          <ToolbarButton
            onClick={() => {
              if (editor.isActive('link')) {
                // Only remove link if text is selected, otherwise just deactivate the mark
                const { $from, $to } = editor.state.selection;
                if ($from.pos !== $to.pos) {
                  // Text is selected - remove link from selection
                  editor.chain().focus().unsetLink().run();
                } else {
                  // No selection - just unset the link mark so new text isn't a link
                  editor.chain().focus().unsetMark('link').run();
                }
              } else {
                setIsLinkModalOpen(true);
                setLinkUrl('');
              }
              setUpdateCount(c => c + 1);
            }}
            active={editor.isActive('link')}
            icon={<LinkIcon size={18} />}
            title="Link"
            onToolbarChange={() => setUpdateCount(c => c + 1)}
          />
          <div className="w-px bg-[var(--border)]" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            icon={<List size={18} />}
            title="Bullet List"
            onToolbarChange={() => setUpdateCount(c => c + 1)}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            icon={<ListOrdered size={18} />}
            title="Ordered List"
            onToolbarChange={() => setUpdateCount(c => c + 1)}
          />
        </div>
      )}

      {/* Editor */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minHeight: '50px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--panel-1)', boxSizing: 'border-box' }}>
        {editor && editor.isEmpty && !isFocused && (
          <div
            style={{
              position: 'absolute',
              left: '16px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              fontSize: '1rem',
              zIndex: 1,
            }}
          >
            Click here and start typing your note...
          </div>
        )}
        <EditorContent
          editor={editor}
          className={styles.editor}
          style={{
            flex: 1,
            padding: '12px 16px',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      {/* Character count (optional) */}
      <div className="text-xs text-[var(--text-muted)] text-right">
        {editor.storage.characterCount?.characters?.() || 0} characters
      </div>

      {/* Link Modal */}
      {isLinkModalOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
            onClick={() => setIsLinkModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--panel)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                maxWidth: '400px',
                width: '100%',
                margin: '0 16px',
                padding: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                  Add Link
                </h3>
                <button
                  onClick={() => setIsLinkModalOpen(false)}
                  style={{
                    color: 'var(--text-muted)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '8px' }}>
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--input)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 150ms, box-shadow 150ms',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (linkUrl.trim()) {
                        // Ensure URL has a protocol
                        let url = linkUrl.trim();
                        if (!url.match(/^https?:\/\//)) {
                          url = 'https://' + url;
                        }
                        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                        setIsLinkModalOpen(false);
                        setLinkUrl('');
                      }
                    }
                    if (e.key === 'Escape') {
                      setIsLinkModalOpen(false);
                      setLinkUrl('');
                    }
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setIsLinkModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (linkUrl.trim()) {
                      // Ensure URL has a protocol
                      let url = linkUrl.trim();
                      if (!url.match(/^https?:\/\//)) {
                        url = 'https://' + url;
                      }
                      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                      setIsLinkModalOpen(false);
                      setLinkUrl('');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'opacity 150ms ease',
                    opacity: linkUrl.trim() ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (linkUrl.trim()) {
                      e.currentTarget.style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (linkUrl.trim()) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                  disabled={!linkUrl.trim()}
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  title: string;
}

interface ToolbarButtonWithSetUpdateProps extends ToolbarButtonProps {
  onToolbarChange: () => void;
}

function ToolbarButton({ onClick, active, icon, title, onToolbarChange }: ToolbarButtonWithSetUpdateProps) {
  return (
    <button
      onClick={() => {
        onClick();
        // Trigger immediate re-render on next frame
        requestAnimationFrame(() => {
          onToolbarChange();
        });
      }}
      title={title}
      style={{
        padding: '6px',
        backgroundColor: active ? 'var(--accent)' : 'transparent',
        color: active ? 'white' : 'var(--text-muted)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
      type="button"
    >
      {icon}
    </button>
  );
}
