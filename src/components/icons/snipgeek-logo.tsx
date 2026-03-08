
import React from 'react';

interface SnipGeekLogoProps extends React.SVGProps<SVGSVGElement> { }

/**
 * SnipGeekLogo — Adaptive Contextual (Option 3)
 * Light Mode: deep navy blues — high contrast on #DDE2EE background
 * Dark Mode:  soft sky glows  — high contrast on #141B20 background
 */
export const SnipGeekLogo = ({
  className,
  ...props
}: SnipGeekLogoProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Light Mode — deep navy for contrast on #DDE2EE */}
      <g className="dark:hidden">
        <polygon points="5,5 46,5 46,37 37,46 5,46" fill="#0369a1" />
        <polygon points="63,54 95,54 95,95 54,95 54,63" fill="#0369a1" />
        <rect x="54" y="5" width="41" height="41" rx="4" fill="#1e3a8a" />
        <rect x="5" y="54" width="41" height="41" rx="4" fill="#1e3a8a" />
        <circle cx="50" cy="50" r="2" fill="#0ea5e9" opacity="0.9" />
      </g>

      {/* Dark Mode — soft sky glow for contrast on #141B20 */}
      <g className="hidden dark:block">
        <polygon points="5,5 46,5 46,37 37,46 5,46" fill="#7dd3fc" />
        <polygon points="63,54 95,54 95,95 54,95 54,63" fill="#7dd3fc" />
        <rect x="54" y="5" width="41" height="41" rx="4" fill="#bfdbfe" opacity="0.85" />
        <rect x="5" y="54" width="41" height="41" rx="4" fill="#bfdbfe" opacity="0.85" />
        <circle cx="50" cy="50" r="2" fill="#38bdf8" opacity="0.9" />
      </g>
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
