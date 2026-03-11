
import React, { useId } from 'react';

type SnipGeekLogoProps = React.SVGProps<SVGSVGElement>;

/**
 * SnipGeekLogo - Adaptive branding with two versions:
 * 1. Colorful gradients for Light Mode.
 * 2. Monochrome white with opacities for Dark Mode.
 */
export const SnipGeekLogo = ({
  className,
  ...props
}: SnipGeekLogoProps) => {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={`blue-bright-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id={`blue-deep-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0c2461" />
        </linearGradient>
      </defs>

      {/* Light Mode Version (Default) */}
      <g className="dark:hidden transition-opacity duration-500">
        <polygon
          points="5,5 46,5 46,37 37,46 5,46"
          fill={`url(#blue-bright-${id})`}
        />
        <polygon
          points="63,54 95,54 95,95 54,95 54,63"
          fill={`url(#blue-bright-${id})`}
        />
        <rect
          x="54" y="5" width="41" height="41" rx="4"
          fill={`url(#blue-deep-${id})`}
        />
        <rect
          x="5" y="54" width="41" height="41" rx="4"
          fill={`url(#blue-deep-${id})`}
        />
        <circle cx="50" cy="50" r="2" fill="#bae6fd" opacity="0.9" />
      </g>

      {/* Dark Mode Version (Monochrome White) */}
      <g className="hidden dark:block transition-opacity duration-500">
        <polygon points="5,5 46,5 46,37 37,46 5,46" fill="white" />
        <polygon points="63,54 95,54 95,95 54,95 54,63" fill="white" />
        <rect x="54" y="5" width="41" height="41" rx="4" fill="white" opacity="0.3" />
        <rect x="5" y="54" width="41" height="41" rx="4" fill="white" opacity="0.3" />
        <circle cx="50" cy="50" r="2" fill="white" opacity="0.6" />
      </g>
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
