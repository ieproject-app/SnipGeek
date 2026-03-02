'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const FirebaseClientProvider = dynamic(() =>
  import('@/firebase').then((mod) => mod.FirebaseClientProvider),
  { ssr: false }
);

export function FirebaseProviderWrapper({ children }: { children: React.ReactNode }) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
