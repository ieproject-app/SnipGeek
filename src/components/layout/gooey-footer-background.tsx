'use client';

import React from 'react';

/**
 * GooeyFooterBackground Component
 * Creates a premium "liquid" effect using SVG filters and animated circles.
 * The blobs move randomly and appear to merge when they touch.
 */
export function GooeyFooterBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-20 select-none">
      <svg width="100%" height="100%" className="w-full h-full">
        <defs>
          <filter id="footer-gooey-filter">
            {/* Step 1: Blur the graphics */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            {/* Step 2: Increase contrast of the alpha channel to create the gooey bond */}
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -9" 
              result="goo" 
            />
            {/* Step 3: Composite the original graphic on top of the goo */}
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
        <g filter="url(#footer-gooey-filter)">
          {/* Liquid Blob 1 - Moving horizontally and vertically */}
          <circle cx="20%" cy="40%" r="60" fill="currentColor" className="text-primary">
            <animate attributeName="cx" values="20%;35%;15%;20%" dur="25s" repeatCount="indefinite" />
            <animate attributeName="cy" values="40%;30%;55%;40%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="r" values="60;85;55;60" dur="18s" repeatCount="indefinite" />
          </circle>
          
          {/* Liquid Blob 2 - Counter movement */}
          <circle cx="80%" cy="30%" r="80" fill="currentColor" className="text-accent">
            <animate attributeName="cx" values="80%;65%;85%;80%" dur="30s" repeatCount="indefinite" />
            <animate attributeName="cy" values="30%;55%;20%;30%" dur="28s" repeatCount="indefinite" />
            <animate attributeName="r" values="80;60;100;80" dur="20s" repeatCount="indefinite" />
          </circle>
          
          {/* Liquid Blob 3 - Slow central drift */}
          <circle cx="50%" cy="70%" r="70" fill="currentColor" className="text-primary">
            <animate attributeName="cx" values="50%;65%;40%;50%" dur="35s" repeatCount="indefinite" />
            <animate attributeName="cy" values="70%;50%;85%;70%" dur="32s" repeatCount="indefinite" />
            <animate attributeName="r" values="70;90;60;70" dur="25s" repeatCount="indefinite" />
          </circle>
          
          {/* Liquid Blob 4 - Edge drift */}
          <circle cx="10%" cy="80%" r="50" fill="currentColor" className="text-accent">
            <animate attributeName="cx" values="10%;25%;5%;10%" dur="20s" repeatCount="indefinite" />
            <animate attributeName="cy" values="80%;65%;95%;80%" dur="24s" repeatCount="indefinite" />
            <animate attributeName="r" values="50;70;45;50" dur="15s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
}
