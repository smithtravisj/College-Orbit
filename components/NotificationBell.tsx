'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Check, Clock, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import useAppStore from '@/lib/store';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const isMobile = useIsMobile();
  const { settings } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownOffset, setDropdownOffset] = useState({ left: 0, top: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds for near real-time updates

    // Listen for notification refresh events from other components
    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener('notification-refresh', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-refresh', handleRefresh);
    };
  }, []);

  // Calculate dropdown position to prevent going off-screen
  useEffect(() => {
    if (!showDropdown || !dropdownRef.current || !containerRef.current) return;

    const calculatePosition = () => {
      const button = containerRef.current?.querySelector('button');
      const dropdown = dropdownRef.current;
      if (!button || !dropdown) return;

      const buttonRect = button.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const padding = 16;
      const viewportWidth = window.innerWidth;

      // Calculate ideal position (dropdown right-aligned with button)
      let left = buttonRect.right - dropdownRect.width;

      // Check if it goes off left
      if (left < padding) {
        left = padding;
      }

      // Check if it goes off right
      if (left + dropdownRect.width > viewportWidth - padding) {
        left = viewportWidth - dropdownRect.width - padding;
      }

      // Calculate top position (above the button)
      let top = buttonRect.top - dropdownRect.height - 8;

      if (top < padding) {
        top = buttonRect.bottom + 8;
      }

      setDropdownOffset({ left, top });
    };

    // Use requestAnimationFrame to ensure element is rendered before measuring
    const frame = requestAnimationFrame(() => {
      calculatePosition();
    });

    window.addEventListener('resize', calculatePosition);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [showDropdown]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const wasUnread = !notifications.find(n => n.id === notificationId)?.read;
        setNotifications(notifications.filter(n => n.id !== notificationId));
        if (wasUnread) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'college_request_approved' || type === 'issue_report_resolved' || type === 'feature_request_implemented') {
      return <Check size={18} style={{ color: '#10b981' }} />;
    }
    if (type === 'exam_reminder') {
      return <AlertCircle size={18} style={{ color: '#ef4444' }} />;
    }
    if (type === 'college_request_pending' || type === 'issue_report_pending' || type === 'feature_request_pending' || type === 'feature_request' || type === 'issue_report' || type === 'college_request_submitted' || type === 'issue_report_submitted' || type === 'feature_request_submitted') {
      return <Clock size={18} style={{ color: '#f59e0b' }} />;
    }
    return <X size={18} style={{ color: '#ef4444' }} />;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && typeof window !== 'undefined' && createPortal(
        <>
          <style>{`
            .notification-dropdown::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {/* Close dropdown when clicking outside */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2147483646,
            }}
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div
            className="notification-dropdown"
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: `${dropdownOffset.left}px`,
              top: `${dropdownOffset.top}px`,
              width: 'auto',
              minWidth: isMobile ? '280px' : '300px',
              maxWidth: isMobile ? '320px' : '360px',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: isMobile ? '400px' : '500px',
              overflow: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              zIndex: 2147483647,
            } as React.CSSProperties & { scrollbarWidth?: string; msOverflowStyle?: string }}
          >
            {/* Header */}
            <div
              style={{
                padding: isMobile ? '8px 12px' : '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: 'var(--text)' }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: isMobile ? '11px' : '12px',
                    fontWeight: '500',
                    transition: 'opacity 0.2s ease',
                    ...(settings.theme === 'dark' && { filter: 'brightness(1.6)' }),
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div style={{ padding: isMobile ? '16px 12px' : '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: isMobile ? '13px' : '14px', margin: 0 }}>No notifications</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    style={{
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = notification.read ? 'var(--panel-2)' : 'rgba(59, 130, 246, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          cursor: 'pointer',
                        }}
                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <div style={{ marginTop: '2px' }}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                margin: '0 0 4px 0',
                                fontSize: isMobile ? '14px' : '15px',
                                fontWeight: notification.read ? '400' : '600',
                                color: 'var(--text)',
                              }}
                            >
                              {notification.title}
                            </p>
                            <p
                              style={{
                                margin: '0 0 6px 0',
                                fontSize: isMobile ? '12px' : '14px',
                                color: 'var(--text-muted)',
                                lineHeight: '1.4',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {notification.message}
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                              {getTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: isMobile ? '4px 6px' : '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          borderRadius: '6px',
                          lineHeight: '1',
                          alignSelf: 'center',
                          flexShrink: 0,
                          margin: '0px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <X size={isMobile ? 16 : 18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
