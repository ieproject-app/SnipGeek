'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    // Check for manual theme override expiration
    const manualExpire = localStorage.getItem('snipgeek-theme-manual-expire');
    if (manualExpire) {
      const expireTime = parseInt(manualExpire, 10);
      if (Date.now() > expireTime) {
        // Override expired, revert to system
        localStorage.removeItem('snipgeek-theme-manual-expire');
        // We set it to system so next-themes will use the system preference
        localStorage.setItem('theme', 'system');
      }
    } else {
      // No manual override, ensure it's system if not already set
      if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'system');
      }
    }
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
