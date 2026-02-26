'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotificationContextType {
  message: string | null;
  icon: ReactNode | null;
  notify: (msg: string, icon?: ReactNode) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [icon, setIcon] = useState<ReactNode | null>(null);

  const notify = useCallback((msg: string, icon?: ReactNode) => {
    setMessage(msg);
    setIcon(icon || null);
    
    // Auto-clear message after a set time (2.5 seconds)
    const timer = setTimeout(() => {
      setMessage(null);
      // We don't clear icon immediately to let it fade out with the bar
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NotificationContext.Provider value={{ message, icon, notify }}>
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
