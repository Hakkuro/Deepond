import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  read: number;
  created_at: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Setup SSE for real-time notifications
      const token = localStorage.getItem('kanban_token');
      const evtSource = new EventSource(`${window.location.origin}/api/notifications/stream?token=${token}`);
      
      evtSource.onmessage = (e) => {
        try {
          const newNotif = JSON.parse(e.data);
          setNotifications(prev => [newNotif, ...prev]);
          toast.info(newNotif.content || newNotif.title);
        } catch (err) {
          console.error("Error parsing SSE data:", err);
        }
      };

      return () => {
        evtSource.close();
      };
    } else {
      setNotifications([]);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    }
  };

  const unreadCount = notifications.filter(n => n.read === 0).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
