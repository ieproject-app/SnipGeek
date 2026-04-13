'use client';

import React from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export function FirebaseProviderWrapper({ children }: { children: React.ReactNode }) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
