'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import {
  type Analytics,
  getAnalytics,
  isSupported,
  logEvent,
  setCurrentScreen,
} from 'firebase/analytics';
import { usePathname, useSearchParams } from 'next/navigation';
import { useFirebaseApp } from '@/firebase';

const hasMeasurementId = Boolean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);

function AnalyticsTrackerInner() {
  const firebaseApp = useFirebaseApp();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!firebaseApp || analytics || !hasMeasurementId) return;

    let isCancelled = false;

    const setupAnalytics = async () => {
      const supported = await isSupported();
      if (!supported || isCancelled) return;
      setAnalytics(getAnalytics(firebaseApp));
    };

    setupAnalytics().catch((error) => {
      console.error('Firebase Analytics initialization failed:', error);
    });

    return () => {
      isCancelled = true;
    };
  }, [firebaseApp, analytics]);

  useEffect(() => {
    if (!analytics) return;

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    if (lastTrackedPathRef.current === pagePath) return;
    lastTrackedPathRef.current = pagePath;

    setCurrentScreen(analytics, pagePath);
    logEvent(analytics, 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [analytics, pathname, searchParams]);

  return null;
}

export function FirebaseAnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </Suspense>
  );
}
