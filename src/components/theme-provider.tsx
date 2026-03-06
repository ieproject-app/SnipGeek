"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;
import { STORAGE_KEYS } from "@/lib/constants";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    // Check for manual theme override expiration
    const manualExpire = localStorage.getItem(STORAGE_KEYS.THEME_MANUAL_EXPIRE);
    if (manualExpire) {
      const expireTime = parseInt(manualExpire, 10);
      if (Date.now() > expireTime) {
        // Override expired, revert to system
        localStorage.removeItem(STORAGE_KEYS.THEME_MANUAL_EXPIRE);
        // We set it to system so next-themes will use the system preference
        localStorage.setItem(STORAGE_KEYS.THEME, "system");
      }
    } else {
      // No manual override, ensure it's system if not already set
      if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        localStorage.setItem(STORAGE_KEYS.THEME, "system");
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
