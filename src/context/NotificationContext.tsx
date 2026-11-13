import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  NotificationItem,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notifications';
import {
  fetchAllNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  dismissNotification as dismissService,
  bulkDismissNotifications,
  getNotificationPreferences,
  saveNotificationPreferences,
} from '@/services/notifications/notificationService';
import { supabase } from '@/services/supabase/client';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  hasImportant: boolean;
  loading: boolean;
  preferences: NotificationPreferences;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  bulkDismiss: (ids: string[]) => Promise<void>;
  updatePreferences: (prefs: NotificationPreferences) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences);

  const refresh = useCallback(async () => {
    try {
      const items = await fetchAllNotifications();
      setNotifications(items);
    } catch (err) {
      console.warn('Failed to refresh notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // 1. Polling interval (every 45 seconds)
    const interval = setInterval(refresh, 45000);

    // 2. Custom window event listener for immediate zero-latency updates
    const handleUpdateEvent = () => {
      refresh();
    };
    window.addEventListener('teamflow:notifications-updated', handleUpdateEvent);

    // 3. Supabase Realtime subscription on activity_events & notifications
    let channel: any = null;
    try {
      channel = supabase
        .channel('teamflow-notifications-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'activity_events' },
          () => refresh()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          () => refresh()
        )
        .subscribe();
    } catch (realtimeErr) {
      console.warn('Supabase Realtime not subscribed:', realtimeErr);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('teamflow:notifications-updated', handleUpdateEvent);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refresh]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    await markNotificationAsRead(id);
  };

  const markAsUnread = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: false, read_at: null } : n))
    );
    await markNotificationAsUnread(id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    if (unreadIds.length > 0) {
      await markAllNotificationsAsRead(unreadIds);
    }
  };

  const dismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await dismissService(id);
  };

  const bulkDismiss = async (ids: string[]) => {
    const idSet = new Set(ids);
    setNotifications((prev) => prev.filter((n) => !idSet.has(n.id)));
    await bulkDismissNotifications(ids);
  };

  const updatePreferences = (newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs);
    saveNotificationPreferences(newPrefs);
    refresh();
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const hasImportant = useMemo(() => {
    return notifications.some(
      (n) => !n.is_read && (n.priority === 'critical' || n.priority === 'important')
    );
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasImportant,
        loading,
        preferences,
        refresh,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        dismiss,
        bulkDismiss,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
