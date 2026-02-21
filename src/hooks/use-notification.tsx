'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotificationContextType {
  message: string | null;
  notify: (msg: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setMessage(msg);
    // Auto-clear message after 3 seconds
    const timer = setTimeout(() => {
      setMessage(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NotificationContext.Provider value={{ message, notify }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
