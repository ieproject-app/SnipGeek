import React, { useId } from 'react';

interface SnipGeekLogoProps extends React.SVGProps<SVGSVGElement> {
  showBackground?: boolean;
  showBadge?: boolean;
}

/**
 * SnipGeekLogo - Refined 'Snipped' design with dual-tone active states and center pivot.
 * Features a custom cyan-to-sky gradient, glow filters, and a unique polygon shape.
 */
export const SnipGeekLogo = ({ 
  className, 
  showBackground,
  showBadge,
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
        <linearGradient id={`sc-blue-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9"/>
          <stop offset="100%" stopColor="#0ea5e9"/>
        </linearGradient>
        
        <filter id={`sc-glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <style>{`
          .w3-tl-${id} { animation: pulse-a-${id} 3s ease-in-out infinite;       transform-origin: 26px 26px; }
          .w3-br-${id} { animation: pulse-a-${id} 3s ease-in-out 1.5s infinite;  transform-origin: 74px 74px; }
          .w3-tr-${id} { animation: pulse-b-${id} 3s ease-in-out 0.75s infinite; transform-origin: 74px 26px; }
          .w3-bl-${id} { animation: pulse-b-${id} 3s ease-in-out 2.25s infinite; transform-origin: 26px 74px; }
          .w3-dot-${id} { animation: pulse-a-${id} 3s ease-in-out 0.2s infinite; transform-origin: 50px 50px; }

          @keyframes pulse-a-${id} {
            0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 0px #38bdf8); opacity: 1; }
            40%       { transform: scale(1.05); filter: drop-shadow(0 0 10px #38bdf888); opacity: 0.9; }
            70%       { transform: scale(0.97); }
          }
          @keyframes pulse-b-${id} {
            0%, 100% { transform: scale(1);    opacity: 0.4; }
            40%       { transform: scale(0.93); opacity: 0.22; }
            70%       { transform: scale(1.02); opacity: 0.4; }
          }
        `}</style>
      </defs>

      {/* TL: active — snipped bottom-right corner */}
      <polygon 
        className={`w3-tl-${id}`} 
        filter={`url(#sc-glow-${id})`}
        points="5,5 47,5 47,38 38,47 5,47"
        fill={`url(#sc-blue-${id})`}
      />

      {/* BR: active — snipped top-left corner */}
      <polygon 
        className={`w3-br-${id}`} 
        filter={`url(#sc-glow-${id})`}
        points="62,53 95,53 95,95 53,95 53,62"
        fill={`url(#sc-blue-${id})`}
      />

      {/* TR: dim */}
      <rect className={`w3-tr-${id}`} x="53" y="5" width="42" height="42" rx="4" fill="#1e293b"/>

      {/* BL: dim */}
      <rect className={`w3-bl-${id}`} x="5" y="53" width="42" height="42" rx="4" fill="#1e293b"/>

      {/* Center pivot dot */}
      <circle className={`w3-dot-${id}`} cx="50" cy="50" r="2.5" fill="#38bdf8" opacity="0.8"/>
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
