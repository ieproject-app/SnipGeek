'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useFirebaseApp } from '@/firebase';

const hasMeasurementId = Boolean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);
type FirebaseAnalyticsModule = typeof import('firebase/analytics');
type AnalyticsInstance = import('firebase/analytics').Analytics;


function AnalyticsTrackerInner() {
  const firebaseApp = useFirebaseApp();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [analytics, setAnalytics] = useState<AnalyticsInstance | null>(null);
  const analyticsModuleRef = useRef<FirebaseAnalyticsModule | null>(null);
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!firebaseApp || analytics || !hasMeasurementId) return;

    let isCancelled = false;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const setupAnalytics = async () => {
      const analyticsModule = await import('firebase/analytics');
      if (isCancelled) return;

      const supported = await analyticsModule.isSupported();
      if (!supported || isCancelled) return;

      analyticsModuleRef.current = analyticsModule;
      setAnalytics(analyticsModule.getAnalytics(firebaseApp));
    };

    const bootstrapWhenIdle = () => {
      setupAnalytics().catch(() => {
        // Keep analytics failures non-fatal and silent in production.
      });
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => bootstrapWhenIdle(), { timeout: 4000 });
    } else {
      timeoutId = setTimeout(bootstrapWhenIdle, 2000);
    }

    return () => {
      isCancelled = true;

      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [firebaseApp, analytics]);

  useEffect(() => {
    if (!analytics || !analyticsModuleRef.current) return;
    const analyticsModule = analyticsModuleRef.current;

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    if (lastTrackedPathRef.current === pagePath) return;
    lastTrackedPathRef.current = pagePath;

    analyticsModule.setCurrentScreen(analytics, pagePath);
    analyticsModule.logEvent(analytics, 'page_view', {
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
