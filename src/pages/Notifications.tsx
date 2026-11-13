import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useNotifications } from '@/context/NotificationContext';
import { useDashboardTheme } from '@/context/DashboardThemeContext';
import {
  NotificationItem,
  NotificationCategory,
  NotificationPriority,
} from '@/types/notifications';
import { formatRelativeTime, formatDate } from '@/utils/dates';
import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  Users,
  Database,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useDashboardTheme();
  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    dismiss,
    bulkDismiss,
  } = useNotifications();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | NotificationCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | NotificationPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Selected items for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmDismissOpen, setIsConfirmDismissOpen] = useState(false);

  // Group notifications by date: Today, Yesterday, This Week, Earlier
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Search
      if (search) {
        const query = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesMessage = item.message.toLowerCase().includes(query);
        const matchesEntity = item.related_entity_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMessage && !matchesEntity) return false;
      }

      // Status
      if (statusFilter === 'unread' && item.is_read) return false;
      if (statusFilter === 'read' && !item.is_read) return false;

      // Category
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Priority
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      return true;
    });
  }, [notifications, search, statusFilter, categoryFilter, priorityFilter]);

  const dateGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const groups: {
      today: NotificationItem[];
      yesterday: NotificationItem[];
      thisWeek: NotificationItem[];
      earlier: NotificationItem[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    filteredNotifications.forEach((item) => {
      const d = new Date(item.created_at);
      d.setHours(0, 0, 0, 0);

      if (d.getTime() >= today.getTime()) {
        groups.today.push(item);
      } else if (d.getTime() >= yesterday.getTime()) {
        groups.yesterday.push(item);
      } else if (d.getTime() >= oneWeekAgo.getTime()) {
        groups.thisWeek.push(item);
      } else {
        groups.earlier.push(item);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkMarkRead = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await markAsRead(id);
    }
    setSelectedIds([]);
  };

  const handleBulkDismissConfirm = async () => {
    if (selectedIds.length === 0) return;
    await bulkDismiss(selectedIds);
    setSelectedIds([]);
    setIsConfirmDismissOpen(false);
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border-[0.5px] bg-[#E99A88]/20 text-[#C93B2B] dark:text-[#E99A88] border-[#E99A88]/30">
            Critical
          </span>
        );
      case 'important':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border-[0.5px] bg-[#F2D76B]/20 text-[#A87E14] dark:text-[#F2D76B] border-[#F2D76B]/30">
            Important
          </span>
        );
      case 'normal':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border-[0.5px] bg-[#AFC7E9]/20 text-[#3E6392] dark:text-[#AFC7E9] border-[#AFC7E9]/30">
            Normal
          </span>
        );
      case 'informational':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border-[0.5px] bg-[#A9BB78]/20 text-[#436E20] dark:text-[#A9BB78] border-[#A9BB78]/30">
            Informational
          </span>
        );
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-[#3E6392] dark:text-[#AFC7E9]" />;
      case 'project':
        return <FolderKanban className="w-4 h-4 text-[#A87E14] dark:text-[#F2D76B]" />;
      case 'team':
        return <Users className="w-4 h-4 text-[#436E20] dark:text-[#A9BB78]" />;
      case 'attendance':
        return <Clock className="w-4 h-4 text-[#C93B2B] dark:text-[#E99A88]" />;
      case 'system':
      default:
        return <Database className="w-4 h-4 text-secondary dark:text-[#B5B2AD]" />;
    }
  };

  const renderNotificationCard = (item: NotificationItem) => {
    const isSelected = selectedIds.includes(item.id);

    return (
      <Card
        key={item.id}
        onClick={() => {
          if (!item.is_read) markAsRead(item.id);
          navigate(item.target_route);
        }}
        className={clsx(
          'p-4 transition-all cursor-pointer relative group border-[0.5px]',
          isSelected
            ? 'ring-2 ring-accent'
            : !item.is_read
            ? isDark
              ? 'bg-[#222226] border-[#393940]'
              : 'bg-[#FFFDF7] border-black shadow-soft'
            : isDark
            ? 'bg-[#1C1C1F] border-[#393940]/60 opacity-90'
            : 'bg-surface border-border shadow-xs'
        )}
      >
        <div className="flex items-start gap-3.5">
          {/* Checkbox for bulk actions */}
          <div
            className="pt-0.5 shrink-0"
            onClick={(e) => toggleSelect(item.id, e)}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
            />
          </div>

          {/* Category Icon */}
          <div
            className={clsx(
              'w-9 h-9 rounded-xl border-[0.5px] flex items-center justify-center shrink-0 mt-0.5',
              isDark
                ? 'bg-[#27272B] border-[#393940]'
                : 'bg-[#F4EFE6] border-black/15'
            )}
          >
            {getCategoryIcon(item.category)}
          </div>

          {/* Core Content */}
          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {getPriorityBadge(item.priority)}

              <span
                className={clsx(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border-[0.5px]',
                  isDark
                    ? 'bg-[#27272B] border-[#393940] text-[#B5B2AD]'
                    : 'bg-gray-100 border-gray-200 text-secondary'
                )}
              >
                {item.category}
              </span>

              {item.related_entity_name && (
                <span
                  className={clsx(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-md border-[0.5px] truncate max-w-[200px]',
                    isDark
                      ? 'bg-[#27272B] border-[#393940] text-[#F5F3EE]'
                      : 'bg-[#EEE9DD] border-black/20 text-primary'
                  )}
                >
                  {item.related_entity_name}
                </span>
              )}

              <span className="text-[11px] text-secondary ml-auto shrink-0 font-medium">
                {formatRelativeTime(item.created_at)}
              </span>
            </div>

            <h4
              className={clsx(
                'text-sm font-bold tracking-tight',
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
            </h4>

            <p
              className={clsx(
                'text-xs mt-1 leading-relaxed',
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

            <div className="flex items-center gap-3 mt-3 pt-2 border-t-[0.5px] border-black/5 dark:border-[#393940]/50 text-xs">
              <span className="font-semibold text-accent flex items-center gap-1 group-hover:underline">
                <span>Open Record</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>

              <span className="text-secondary text-[11px]">
                Target: {item.target_route}
              </span>
            </div>
          </div>

          {/* Quick Item Actions */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            {!item.is_read && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#E99A88] shrink-0" />
            )}

            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
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
                  'p-1.5 rounded-lg border-[0.5px] text-xs transition-colors',
                  isDark
                    ? 'bg-[#27272B] hover:bg-[#323238] border-[#393940] text-[#B5B2AD]'
                    : 'bg-white hover:bg-gray-100 border-black/15 text-secondary'
                )}
                title={item.is_read ? 'Mark as unread' : 'Mark as read'}
              >
                {item.is_read ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss(item.id);
                }}
                className={clsx(
                  'p-1.5 rounded-lg border-[0.5px] text-xs transition-colors',
                  isDark
                    ? 'bg-[#27272B] hover:bg-[#323238] border-[#393940] text-[#E99A88]'
                    : 'bg-white hover:bg-red-50 border-black/15 text-danger'
                )}
                title="Dismiss"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-bold shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary dark:text-[#F5F3EE]">
              Notification Centre & Operational Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E99A88] text-black border-[0.5px] border-black">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-secondary dark:text-[#85838A] mt-1">
            Real-time operational briefing, overdue tasks, approvals, and system notifications for the Design Lead
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            icon={<RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />}
            className="border-[0.5px] border-black text-xs font-bold"
          >
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              icon={<CheckCheck className="w-4 h-4" />}
              className="border-[0.5px] border-black text-xs font-bold"
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-[0.5px] border-black">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search alerts, tasks, projects, employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 dark:bg-[#27272B] border border-border dark:border-[#393940] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Filter Selects */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#27272B] border border-border dark:border-[#393940] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#27272B] border border-border dark:border-[#393940] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent font-medium"
          >
            <option value="all">All Categories</option>
            <option value="task">Tasks</option>
            <option value="project">Projects</option>
            <option value="attendance">Attendance & HR</option>
            <option value="team">Team</option>
            <option value="system">System & Cloud</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#27272B] border border-border dark:border-[#393940] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="important">Important</option>
            <option value="normal">Normal</option>
            <option value="informational">Informational</option>
          </select>
        </div>
      </Card>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-[#F2D76B]/25 border-[0.5px] border-black rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-primary dark:text-[#F5F3EE]">
            <span>{selectedIds.length} notification(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkMarkRead}
              className="text-xs font-bold border-[0.5px] border-black bg-white"
            >
              Mark Selected Read
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsConfirmDismissOpen(true)}
              className="text-xs font-bold border-[0.5px] border-black"
            >
              Dismiss Selected
            </Button>
          </div>
        </div>
      )}

      {/* Notifications Grouped by Date */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6 text-secondary" />}
          title="No notifications found"
          description="You are completely caught up or no notifications match your filter criteria."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setCategoryFilter('all');
            setPriorityFilter('all');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {dateGroups.today.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary dark:text-[#F5F3EE] uppercase tracking-wider">
                  Today
                </span>
                <span className="h-[1px] flex-1 bg-black/10 dark:bg-[#393940]" />
                <span className="text-xs text-secondary font-medium">
                  {dateGroups.today.length} alert(s)
                </span>
              </div>
              <div className="space-y-3">
                {dateGroups.today.map(renderNotificationCard)}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {dateGroups.yesterday.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary dark:text-[#F5F3EE] uppercase tracking-wider">
                  Yesterday
                </span>
                <span className="h-[1px] flex-1 bg-black/10 dark:bg-[#393940]" />
                <span className="text-xs text-secondary font-medium">
                  {dateGroups.yesterday.length} alert(s)
                </span>
              </div>
              <div className="space-y-3">
                {dateGroups.yesterday.map(renderNotificationCard)}
              </div>
            </div>
          )}

          {/* This Week */}
          {dateGroups.thisWeek.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary dark:text-[#F5F3EE] uppercase tracking-wider">
                  This Week
                </span>
                <span className="h-[1px] flex-1 bg-black/10 dark:bg-[#393940]" />
                <span className="text-xs text-secondary font-medium">
                  {dateGroups.thisWeek.length} alert(s)
                </span>
              </div>
              <div className="space-y-3">
                {dateGroups.thisWeek.map(renderNotificationCard)}
              </div>
            </div>
          )}

          {/* Earlier */}
          {dateGroups.earlier.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary dark:text-[#F5F3EE] uppercase tracking-wider">
                  Earlier
                </span>
                <span className="h-[1px] flex-1 bg-black/10 dark:bg-[#393940]" />
                <span className="text-xs text-secondary font-medium">
                  {dateGroups.earlier.length} alert(s)
                </span>
              </div>
              <div className="space-y-3">
                {dateGroups.earlier.map(renderNotificationCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Bulk Dismiss Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDismissOpen}
        onCancel={() => setIsConfirmDismissOpen(false)}
        onConfirm={handleBulkDismissConfirm}
        title="Dismiss Selected Notifications?"
        message={`Are you sure you want to dismiss ${selectedIds.length} notification(s)? Dismissed notifications will be permanently hidden from the notification centre.`}
        confirmLabel="Dismiss Notifications"
        variant="danger"
      />
    </div>
  );
};
