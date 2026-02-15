'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

/**
 * This component handles the logic for expiring the user's theme choice after 7 days,
 * reverting it back to the system preference.
 */
function ThemeManager() {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const timestampStr = localStorage.getItem('theme-choice-timestamp');
    if (timestampStr) {
      const timestamp = parseInt(timestampStr, 10);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > oneWeek) {
        setTheme('system');
        localStorage.removeItem('theme-choice-timestamp');
      }
    }
    // This effect should only run once on mount to check the initial state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // This component does not render anything.
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
      <ThemeManager />
    </NextThemesProvider>
  );
}
