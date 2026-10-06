import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toasts: Toast[];
  showToast: (
    toastOrMessage: string | Omit<Toast, 'id'>,
    type?: 'success' | 'error' | 'info' | 'warning',
    title?: string
  ) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setIsLoading(true);
      const data = await api.listNotifications(false);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (e) {
      // ignore background notification fetch errors
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = useCallback(
    (
      toastOrMessage: string | Omit<Toast, 'id'>,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      title?: string
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      let newToast: Toast;
      if (typeof toastOrMessage === 'string') {
        newToast = { id, message: toastOrMessage, type, title };
      } else {
        newToast = { ...toastOrMessage, id };
      }
      setToasts(prev => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
      {/* Toast Overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl shadow-premium border transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200'
                : t.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200'
                : t.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-200'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950/80 dark:border-indigo-800 dark:text-indigo-200'
            }`}
          >
            <div className="flex-1 pr-2">
              {t.title && <h4 className="font-semibold text-sm mb-0.5">{t.title}</h4>}
              <p className="text-sm opacity-90">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-2 p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      refreshNotifications: async () => {},
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      toasts: [],
      showToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
};
