'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

interface NotificationContextType {
  message: React.ReactNode;
  icon: React.ReactNode;
  progress: number;
  notify: (msg: React.ReactNode, ic?: React.ReactNode) => void;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<React.ReactNode>(null);
  const [icon, setIcon] = useState<React.ReactNode>(null);
  const [progress, setProgress] = useState(100);

  const duration = 3500;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);

  const clear = useCallback(() => {
    setMessage(null);
    setIcon(null);
    setProgress(100);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const notify = useCallback((msg: React.ReactNode, ic?: React.ReactNode) => {
    // Reset if there's an existing notification (re-trigger)
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    
    setProgress(100);
    setMessage(msg);
    setIcon(ic || null);
    startTime.current = Date.now();

    // Progress bar countdown ~60fps
    const interval = setInterval(() => {
      const pct = 100 - ((Date.now() - startTime.current) / duration) * 100;
      setProgress(Math.max(0, pct));
      if (pct <= 0) clearInterval(interval);
    }, 16);
    progressRef.current = interval;

    // Auto-dismiss
    timerRef.current = setTimeout(() => {
      setMessage(null);
      setIcon(null);
    }, duration);
  }, [duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ message, icon, progress, notify, clear }}>
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
