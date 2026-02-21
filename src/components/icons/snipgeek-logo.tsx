import React from 'react';

/**
 * SnipGeekLogo - Komponen logo SVG dengan sudut membulat (soft corners).
 * Dirancang untuk identitas visual yang modern dan ramah.
 */
export const SnipGeekLogo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <defs>
      <mask id="sg-mask-component">
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
          }}
        >
          SG
        </text>
      </mask>
    </defs>
    
    {/* Background dengan sudut membulat (rx="22") agar tidak runcing */}
    <rect
      width="100"
      height="100"
      rx="22"
      ry="22"
      fill="currentColor"
      mask="url(#sg-mask-component)"
    />
  </svg>
);

SnipGeekLogo.displayName = "SnipGeekLogo";
