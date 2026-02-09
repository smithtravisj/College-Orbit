'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Loader2, Lock, SquarePen } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import useAppStore from '@/lib/store';
import { usePomodoroContext } from '@/context/PomodoroContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
}

const SUGGESTED_QUESTIONS = [
  "What's due this week?",
  "How am I doing on my streak?",
  "What courses am I taking?",
  "What do I need from the store?",
];

export default function AIChatModal({ isOpen, onClose, messages, setMessages }: AIChatModalProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumRequired, setPremiumRequired] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const pomodoro = usePomodoroContext();

  // Drag state for desktop
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition(null);
    }
  }, [isOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panelRef.current) return;
    isDragging.current = true;
    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      // Clamp to viewport
      const maxX = window.innerWidth - 520;
      const maxY = window.innerHeight - 100;
      setPosition({
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [isOpen, isMobile]);

  // When AI replies, scroll to the user's question so both question + reply are visible
  // When user sends a message, scroll to the bottom
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant' && lastUserRef.current) {
      lastUserRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Refocus input after loading finishes (response received or error)
  useEffect(() => {
    if (!isLoading && isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, isOpen]);

  if (!isOpen) return null;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setSuggestedActions([]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'premium_required') {
          setPremiumRequired(true);
          setMessages((prev: Message[]) => prev.slice(0, -1));
          return;
        }
        throw new Error(data.error || 'Failed to get response');
      }

      // Sync created/deleted/updated items to Zustand store so UI updates immediately
      if (data.createdItems && Array.isArray(data.createdItems)) {
        for (const result of data.createdItems) {
          if (!result.success || !result.item) continue;
          const store = useAppStore.getState();
          switch (result.type) {
            // Creates — push new item into array
            case 'workItem':
              useAppStore.setState({ workItems: [...store.workItems, result.item] });
              break;
            case 'exam':
              useAppStore.setState({ exams: [...store.exams, result.item] });
              break;
            case 'course':
              useAppStore.setState({ courses: [...store.courses, result.item] });
              break;
            case 'calendarEvent':
              useAppStore.setState({ calendarEvents: [...store.calendarEvents, result.item] });
              break;
            case 'note':
              useAppStore.setState({ notes: [...store.notes, result.item] });
              break;
            case 'shoppingItem':
              useAppStore.setState({ shoppingItems: [...store.shoppingItems, result.item] });
              break;
            // Status update — replace item in array
            case 'workItemUpdate':
              useAppStore.setState({
                workItems: store.workItems.map((w) => w.id === result.item.id ? result.item : w),
              });
              break;
            // Deletes — remove item from array by ID
            case 'workItemDelete':
              useAppStore.setState({
                workItems: store.workItems.filter((w) => w.id !== result.item.id),
              });
              break;
            case 'examDelete':
              useAppStore.setState({
                exams: store.exams.filter((e) => e.id !== result.item.id),
              });
              break;
            case 'calendarEventDelete':
              useAppStore.setState({
                calendarEvents: store.calendarEvents.filter((e) => e.id !== result.item.id),
              });
              break;
            case 'noteDelete':
              useAppStore.setState({
                notes: store.notes.filter((n) => n.id !== result.item.id),
              });
              break;
            case 'shoppingItemDelete':
              useAppStore.setState({
                shoppingItems: store.shoppingItems.filter((s) => s.id !== result.item.id),
              });
              break;
            // Excluded dates — full sync (replace entire array)
            case 'excludedDateSync':
              useAppStore.setState({ excludedDates: result.item });
              break;
            // Pomodoro — start, pause, or stop the timer
            case 'pomodoroControl': {
              const { action, workDuration, breakDuration } = result.item;
              if (action === 'start') {
                if (workDuration || breakDuration) {
                  pomodoro.applySettings(
                    workDuration || pomodoro.workDuration,
                    breakDuration || pomodoro.breakDuration,
                    pomodoro.isMuted
                  );
                  setTimeout(() => pomodoro.start(), 100);
                } else {
                  pomodoro.start();
                }
              } else if (action === 'pause') {
                pomodoro.pause();
              } else if (action === 'stop') {
                pomodoro.reset();
              } else if (action === 'skip') {
                pomodoro.skip();
              }
              break;
            }
            // Edit/update — replace item in array
            case 'examUpdate':
              useAppStore.setState({
                exams: store.exams.map((e) => e.id === result.item.id ? result.item : e),
              });
              break;
            case 'calendarEventUpdate':
              useAppStore.setState({
                calendarEvents: store.calendarEvents.map((e) => e.id === result.item.id ? result.item : e),
              });
              break;
            case 'noteUpdate':
              useAppStore.setState({
                notes: store.notes.map((n) => n.id === result.item.id ? result.item : n),
              });
              break;
            case 'shoppingItemUpdate':
              useAppStore.setState({
                shoppingItems: store.shoppingItems.map((s) => s.id === result.item.id ? result.item : s),
              });
              break;
            // Bulk operations
            case 'bulkWorkItemUpdate': {
              // Re-fetch to get updated items (bulk update doesn't return full items)
              const action = result.item.action;
              const newStatus = action === 'mark_done' ? 'done' : 'open';
              const titles = new Set(result.item.titles as string[]);
              useAppStore.setState({
                workItems: store.workItems.map((w) =>
                  titles.has(w.title) ? { ...w, status: newStatus } : w
                ),
              });
              break;
            }
            case 'bulkWorkItemDelete': {
              const deleteIds = new Set(result.item.ids as string[]);
              useAppStore.setState({
                workItems: store.workItems.filter((w) => !deleteIds.has(w.id)),
              });
              break;
            }
            // Recurring pattern — add generated work items to store
            case 'recurringPatternCreated': {
              const newWorkItems = result.item.workItems || [];
              if (newWorkItems.length > 0) {
                useAppStore.setState({ workItems: [...store.workItems, ...newWorkItems] });
              }
              break;
            }
            // Study plan — add created items to appropriate store arrays
            case 'studyPlanCreated': {
              const sessions = result.item.sessions || [];
              const newEvents = sessions.filter((s: any) => s._itemType === 'calendarEvent');
              const newWork = sessions.filter((s: any) => s._itemType === 'workItem');
              if (newEvents.length > 0) {
                useAppStore.setState({ calendarEvents: [...store.calendarEvents, ...newEvents] });
              }
              if (newWork.length > 0) {
                useAppStore.setState({ workItems: [...store.workItems, ...newWork] });
              }
              break;
            }
            // GPA entries
            case 'gpaEntry':
              useAppStore.setState({ gpaEntries: [...store.gpaEntries, result.item] });
              break;
            case 'gpaEntryUpdate':
              useAppStore.setState({
                gpaEntries: store.gpaEntries.map((e) => e.id === result.item.id ? result.item : e),
              });
              break;
            case 'gpaEntryDelete':
              useAppStore.setState({
                gpaEntries: store.gpaEntries.filter((e) => e.id !== result.item.id),
              });
              break;
            // Settings — merge into store settings
            case 'settingsUpdate':
              useAppStore.setState({
                settings: { ...store.settings, ...result.item },
              });
              break;
            // Email sent — no store update needed
            case 'emailSent':
              break;
          }
        }
      }

      // Set suggested follow-up actions if provided
      if (data.suggestedActions && Array.isArray(data.suggestedActions)) {
        setSuggestedActions(data.suggestedActions);
      }

      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages((prev: Message[]) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
      // Focus handled by useEffect watching isLoading
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const modalContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: isMobile ? undefined : '560px',
        backgroundColor: 'var(--panel-solid, var(--panel))',
        border: isMobile ? 'none' : '1px solid var(--border)',
        borderRadius: isMobile ? 0 : '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header — draggable on desktop */}
      <div
        onMouseDown={!isMobile ? handleMouseDown : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          cursor: isMobile ? undefined : 'grab',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Chat with Orbi
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="New conversation"
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
              <SquarePen size={16} />
            </button>
          )}
          <button
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
      </div>

      {/* Messages area */}
      <div
        className="ai-chat-messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {premiumRequired ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: '12px',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <Lock size={32} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Premium Feature
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Upgrade to Premium to chat with Orbi about your courses, assignments, exams, and more.
            </p>
            <a
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                marginTop: '4px',
              }}
            >
              <Sparkles size={14} />
              Upgrade
            </a>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: '16px',
              padding: '24px 0',
            }}
          >
            <Sparkles size={28} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
              Ask me anything about your courses, assignments, schedule, or progress.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center',
                maxWidth: '320px',
              }}
            >
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    color: 'var(--text)',
                    backgroundColor: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 150ms',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--border)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-2)')}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              // Track the last user message for scroll targeting (so AI reply shows below the question)
              const isLastUser = msg.role === 'user' &&
                i === messages.map((m, idx) => m.role === 'user' ? idx : -1).filter(idx => idx >= 0).pop();
              return (
              <div
                key={i}
                ref={isLastUser ? lastUserRef : undefined}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  scrollMarginTop: isLastUser ? '12px' : undefined,
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--panel-2)',
                    color: msg.role === 'user' ? 'var(--accent-text)' : 'var(--text)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.content}
                </div>
              </div>
              );
            })}

            {suggestedActions.length > 0 && !isLoading && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  justifyContent: 'flex-start',
                  paddingLeft: '4px',
                }}
              >
                {suggestedActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      color: 'var(--accent)',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--accent)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'background-color 150ms',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent)';
                      e.currentTarget.style.color = 'var(--accent-text)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--accent)';
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: 'var(--panel-2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-muted)', animation: 'aiTypingBounce 1.4s infinite', animationDelay: '0s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-muted)', animation: 'aiTypingBounce 1.4s infinite', animationDelay: '0.2s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-muted)', animation: 'aiTypingBounce 1.4s infinite', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: 'var(--danger)',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      {!premiumRequired && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '14px',
              backgroundColor: 'var(--panel-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: input.trim() ? 'var(--accent)' : 'var(--panel-2)',
              color: input.trim() ? 'var(--accent-text)' : 'var(--text-muted)',
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background-color 150ms',
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      )}

      {/* Typing animation keyframes + hide scrollbar */}
      <style>{`
        @keyframes aiTypingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .ai-chat-messages::-webkit-scrollbar { display: none; }
        .ai-chat-messages { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </div>
  );

  // Mobile: full-screen overlay
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          backgroundColor: 'var(--panel-solid, var(--panel))',
        }}
      >
        {modalContent}
      </div>
    );
  }

  // Desktop: floating draggable panel with backdrop
  const panelStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 520,
        zIndex: 1100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: '12px',
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 520,
        zIndex: 1100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: '12px',
      };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1099,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
        onClick={onClose}
      />
      <div ref={panelRef} style={panelStyle}>
        {modalContent}
      </div>
    </>
  );
}
