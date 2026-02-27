
import React, { useId } from 'react';

interface SnipGeekLogoProps extends React.SVGProps<SVGSVGElement> {
  showBackground?: boolean;
}

/**
 * SnipGeekLogo - Adaptive Monochrome for Dark Mode
 */
export const SnipGeekLogo = ({ 
  className, 
  showBackground,
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
        {/* Colorful Gradients for Light Mode */}
        <linearGradient id={`blue-bright-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="stop-color-[#bae6fd] dark:stop-color-primary" />
          <stop offset="100%" className="stop-color-[#0ea5e9] dark:stop-color-primary" />
        </linearGradient>
        <linearGradient id={`blue-deep-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="stop-color-[#1d4ed8] dark:stop-color-primary/80" />
          <stop offset="100%" className="stop-color-[#0c2461] dark:stop-color-primary/80" />
        </linearGradient>
      </defs>

      {/* Modern Geometry Branding */}
      <g className="transition-colors duration-500">
        <polygon 
            points="5,5 46,5 46,37 37,46 5,46" 
            className="fill-[url(#blue-bright-ID)] dark:fill-primary"
            style={{ fill: `url(#blue-bright-${id})` }}
        />
        <polygon 
            points="63,54 95,54 95,95 54,95 54,63" 
            className="fill-[url(#blue-bright-ID)] dark:fill-primary"
            style={{ fill: `url(#blue-bright-${id})` }}
        />
        <rect 
            x="54" y="5" width="41" height="41" rx="4" 
            className="fill-[url(#blue-deep-ID)] dark:fill-primary/60"
            style={{ fill: `url(#blue-deep-${id})` }}
        />
        <rect 
            x="5" y="54" width="41" height="41" rx="4" 
            className="fill-[url(#blue-deep-ID)] dark:fill-primary/60"
            style={{ fill: `url(#blue-deep-${id})` }}
        />
        <circle cx="50" cy="50" r="3" className="fill-[#bae6fd] dark:fill-primary" opacity="0.9">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
