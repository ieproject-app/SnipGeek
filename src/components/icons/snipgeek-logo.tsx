import React from 'react';

/**
 * SnipGeekLogo - A modern, slanted negative-space SVG logo.
 * Designed to be used in headers, footers, and as a potential favicon source.
 */
export const SnipGeekLogo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <defs>
      <mask id="sg-mask">
        {/* White fills the mask, Black cuts it out */}
        <rect width="100" height="100" fill="white" />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="black"
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontWeight: 900,
            fontSize: '52px',
            fontStyle: 'italic',
            transform: 'skewX(-5deg)', // Adding extra dynamic slant
            transformOrigin: 'center'
          }}
        >
          SG
        </text>
      </mask>
    </defs>
    
    {/* The main logo body using the mask for negative space effect */}
    <rect
      width="100"
      height="100"
      fill="currentColor"
      mask="url(#sg-mask)"
    />
  </svg>
);

SnipGeekLogo.displayName = "SnipGeekLogo";
