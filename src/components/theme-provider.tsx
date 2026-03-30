"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;
import { STORAGE_KEYS } from "@/lib/constants";

// Suppress the React 19 false-positive warning about <script> tags rendered by
// next-themes. The library injects the script via DOM APIs — not JSX — so it
// is safe. This can be removed once next-themes ships a React 19-compatible
// release that uses <template> instead.
const _origConsoleError = typeof console !== "undefined" ? console.error.bind(console) : null;
if (typeof console !== "undefined") {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("script") &&
      args[0].includes("template tag")
    ) {
      return;
    }
    _origConsoleError?.(...args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
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
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
