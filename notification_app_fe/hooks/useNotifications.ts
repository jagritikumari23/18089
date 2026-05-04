import { useState, useCallback } from 'react';

interface Notification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
  score?: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  toggleRead: (id: string) => void;
  isRead: (id: string) => boolean;
}

export function useNotifications(initialNotifications: Notification[]) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const isRead = useCallback((id: string): boolean => {
    return localStorage.getItem(`read_${id}`) === 'true';
  }, []);

  const toggleRead = useCallback((id: string) => {
    const currentlyRead = isRead(id);
    const newReadStatus = !currentlyRead;
    localStorage.setItem(`read_${id}`, newReadStatus.toString());
    
    setNotifications(prev => 
      prev.map(n => 
        n.ID === id 
          ? { ...n, read: newReadStatus }
          : n
      )
    );
  }, [isRead]);

  return {
    notifications,
    setNotifications,
    toggleRead,
    isRead,
  } as UseNotificationsReturn;
}
