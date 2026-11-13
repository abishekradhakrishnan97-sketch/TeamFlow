import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  Users,
  FileText,
  Database,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import { NotificationItem, NotificationCategory, NotificationPriority } from '@/types/notifications';
import { formatRelativeTime } from '@/utils/dates';
import { clsx } from 'clsx';

export const NotificationBellDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useDashboardTheme();
  const {
    notifications,
    unreadCount,
    hasImportant,
    loading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    dismiss,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'important' | 'read'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Counts for tabs
  const unreadItems = notifications.filter((n) => !n.is_read);
  const importantItems = notifications.filter(
    (n) => n.priority === 'critical' || n.priority === 'important'
  );
  const readItems = notifications.filter((n) => n.is_read);

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') return !item.is_read;
    if (activeFilter === 'important')
      return item.priority === 'critical' || item.priority === 'important';
    if (activeFilter === 'read') return item.is_read;
    return true;
  });

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    setIsOpen(false);
    navigate(item.target_route);
  };

  const getPriorityIcon = (priority: NotificationPriority, category: NotificationCategory) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-[#C93B2B]" />;
      case 'important':
        return <Clock className="w-4 h-4 text-[#A87E14]" />;
      case 'normal':
        if (category === 'task') return <CheckSquare className="w-4 h-4 text-[#3E6392]" />;
        if (category === 'project') return <FolderKanban className="w-4 h-4 text-[#3E6392]" />;
        if (category === 'team') return <Users className="w-4 h-4 text-[#3E6392]" />;
        return <FolderKanban className="w-4 h-4 text-[#3E6392]" />;
      case 'informational':
      default:
        if (category === 'system') return <Database className="w-4 h-4 text-[#436E20]" />;
        return <CheckCircle2 className="w-4 h-4 text-[#436E20]" />;
    }
  };

  const getPriorityBadgeStyle = (priority: NotificationPriority) => {
    if (isDark) {
      switch (priority) {
        case 'critical':
          return 'bg-[#E99A88]/20 text-[#E99A88] border-[#E99A88]/30';
        case 'important':
          return 'bg-[#F2D76B]/20 text-[#F2D76B] border-[#F2D76B]/30';
        case 'normal':
          return 'bg-[#AFC7E9]/20 text-[#AFC7E9] border-[#AFC7E9]/30';
        case 'informational':
        default:
          return 'bg-[#A9BB78]/20 text-[#A9BB78] border-[#A9BB78]/30';
      }
    } else {
      switch (priority) {
        case 'critical':
          return 'bg-[#FDE8E5] text-[#C93B2B] border-[#F5C2BC]';
        case 'important':
          return 'bg-[#FEF8E3] text-[#A87E14] border-[#F9E8A2]';
        case 'normal':
          return 'bg-[#EDF3FC] text-[#3E6392] border-[#C8DCF7]';
        case 'informational':
        default:
          return 'bg-[#F1F6EA] text-[#436E20] border-[#D0E2BC]';
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          'relative p-2 rounded-xl border-[0.5px] transition-all flex items-center justify-center focus:outline-none focus:ring-1',
          isDark
            ? 'bg-[#27272B] hover:bg-[#323238] border-[#393940] text-[#F5F3EE] focus:ring-[#AFC7E9]'
            : 'bg-[#FFFDF7] hover:bg-[#EEE9DD] border-black text-primary focus:ring-black'
        )}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-label="Notification Centre"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className={clsx(
              'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs border-[0.5px]',
              hasImportant
                ? 'bg-[#E99A88] text-black border-black animate-pulse'
                : 'bg-[#F2D76B] text-black border-black'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={clsx(
            'absolute right-0 mt-2.5 w-[380px] sm:w-[420px] max-w-[calc(100vw-32px)] rounded-2xl shadow-xl border-[0.5px] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150',
            isDark
              ? 'bg-[#1C1C1F] border-[#393940] text-[#F5F3EE]'
              : 'bg-[#FFFDF7] border-black text-primary'
          )}
        >
          {/* Header */}
          <div
            className={clsx(
              'p-4 pb-3 border-b-[0.5px] flex items-center justify-between',
              isDark ? 'border-b-[#393940] bg-[#171719]' : 'border-b-black/15 bg-[#F9F7F1]'
            )}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border-[0.5px]',
                    isDark
                      ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE]'
                      : 'bg-[#EEE9DD] border-black text-primary'
                  )}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={clsx(
                    'text-[11px] font-semibold flex items-center gap-1 transition-colors hover:underline',
                    isDark ? 'text-[#AFC7E9]' : 'text-accent'
                  )}
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div
            className={clsx(
              'px-3 py-2 border-b-[0.5px] flex items-center gap-1 text-xs overflow-x-auto no-scrollbar',
              isDark ? 'border-b-[#393940] bg-[#1C1C1F]' : 'border-b-black/10 bg-[#FFFDF7]'
            )}
          >
            <button
              onClick={() => setActiveFilter('all')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors shrink-0',
                activeFilter === 'all'
                  ? isDark
                    ? 'bg-[#27272B] text-[#F5F3EE]'
                    : 'bg-[#222222] text-[#FFFDF7]'
                  : isDark
                  ? 'text-[#85838A] hover:text-[#F5F3EE]'
                  : 'text-secondary hover:text-primary'
              )}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors shrink-0',
                activeFilter === 'unread'
                  ? isDark
                    ? 'bg-[#27272B] text-[#F5F3EE]'
                    : 'bg-[#222222] text-[#FFFDF7]'
                  : isDark
                  ? 'text-[#85838A] hover:text-[#F5F3EE]'
                  : 'text-secondary hover:text-primary'
              )}
            >
              Unread ({unreadItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('important')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors shrink-0',
                activeFilter === 'important'
                  ? isDark
                    ? 'bg-[#27272B] text-[#F5F3EE]'
                    : 'bg-[#222222] text-[#FFFDF7]'
                  : isDark
                  ? 'text-[#85838A] hover:text-[#F5F3EE]'
                  : 'text-secondary hover:text-primary'
              )}
            >
              Important ({importantItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('read')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors shrink-0',
                activeFilter === 'read'
                  ? isDark
                    ? 'bg-[#27272B] text-[#F5F3EE]'
                    : 'bg-[#222222] text-[#FFFDF7]'
                  : isDark
                  ? 'text-[#85838A] hover:text-[#F5F3EE]'
                  : 'text-secondary hover:text-primary'
              )}
            >
              Read ({readItems.length})
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-[380px] overflow-y-auto divide-y-[0.5px] divide-black/10 dark:divide-[#393940]">
            {loading ? (
              <div className="p-8 text-center text-xs space-y-2">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <p className={isDark ? 'text-[#85838A]' : 'text-secondary'}>
                  Loading notifications...
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <CheckCircle2
                  className={clsx(
                    'w-8 h-8 mx-auto mb-2 opacity-50',
                    isDark ? 'text-[#A9BB78]' : 'text-[#4D6D24]'
                  )}
                />
                <p className="text-xs font-bold text-primary dark:text-[#F5F3EE]">
                  No notifications. You&apos;re all caught up.
                </p>
                <p className="text-[11px] text-secondary dark:text-[#85838A] mt-1">
                  New tasks, approvals, and system alerts will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.slice(0, 30).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={clsx(
                    'p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative',
                    !item.is_read
                      ? isDark
                        ? 'bg-[#222226] hover:bg-[#27272B]'
                        : 'bg-[#FFFDF7] hover:bg-[#F4EFE6]'
                      : isDark
                      ? 'bg-[#1C1C1F] hover:bg-[#222226]'
                      : 'bg-[#FAF8F3] hover:bg-[#EFEAE0]'
                  )}
                >
                  {/* Category / Priority Icon Box */}
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-xl border-[0.5px] flex items-center justify-center shrink-0 mt-0.5',
                      getPriorityBadgeStyle(item.priority)
                    )}
                  >
                    {getPriorityIcon(item.priority, item.category)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={clsx(
                          'text-xs font-bold truncate leading-tight',
                          item.is_read
                            ? isDark
                              ? 'text-[#B5B2AD]'
                              : 'text-secondary'
                            : isDark
                            ? 'text-[#F5F3EE]'
                            : 'text-primary'
                        )}
                      >
                        {item.title}
                      </span>
                    </div>

                    <p
                      className={clsx(
                        'text-[11px] mt-1 line-clamp-2 leading-relaxed',
                        item.is_read
                          ? isDark
                            ? 'text-[#85838A]'
                            : 'text-secondary'
                          : isDark
                          ? 'text-[#D0CDC7]'
                          : 'text-[#444444]'
                      )}
                    >
                      {item.message}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      {item.related_entity_name && (
                        <span
                          className={clsx(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full border-[0.5px] truncate max-w-[140px]',
                            isDark
                              ? 'bg-[#27272B] border-[#393940] text-[#B5B2AD]'
                              : 'bg-[#EEE9DD] border-black/20 text-primary'
                          )}
                        >
                          {item.related_entity_name}
                        </span>
                      )}

                      <span
                        className={clsx(
                          'text-[10px] font-medium shrink-0',
                          isDark ? 'text-[#85838A]' : 'text-secondary'
                        )}
                      >
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Unread Indicator */}
                  <div className="absolute top-3.5 right-3 flex items-center gap-1">
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#E99A88] shrink-0" />
                    )}

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.is_read) {
                            markAsUnread(item.id);
                          } else {
                            markAsRead(item.id);
                          }
                        }}
                        className={clsx(
                          'p-1 rounded-md text-[10px]',
                          isDark
                            ? 'hover:bg-[#323238] text-[#85838A] hover:text-[#F5F3EE]'
                            : 'hover:bg-[#EEE9DD] text-secondary hover:text-primary'
                        )}
                        title={item.is_read ? 'Mark as unread' : 'Mark as read'}
                      >
                        {item.is_read ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(item.id);
                        }}
                        className={clsx(
                          'p-1 rounded-md text-[10px]',
                          isDark
                            ? 'hover:bg-[#323238] text-[#85838A] hover:text-[#E99A88]'
                            : 'hover:bg-[#EEE9DD] text-secondary hover:text-danger'
                        )}
                        title="Dismiss notification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer: View all notifications */}
          <div
            className={clsx(
              'p-3 border-t-[0.5px] flex items-center justify-between text-xs',
              isDark ? 'border-t-[#393940] bg-[#171719]' : 'border-t-black/15 bg-[#F9F7F1]'
            )}
          >
            <span
              className={clsx(
                'text-[11px] font-medium',
                isDark ? 'text-[#85838A]' : 'text-secondary'
              )}
            >
              {notifications.length} total operational alerts
            </span>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className={clsx(
                'font-bold text-xs flex items-center gap-1 transition-colors hover:underline',
                isDark ? 'text-[#AFC7E9]' : 'text-accent'
              )}
            >
              <span>View all notifications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

