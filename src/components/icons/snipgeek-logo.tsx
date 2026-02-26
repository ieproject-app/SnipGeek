import React, { useId } from 'react';

interface SnipGeekLogoProps extends React.SVGProps<SVGSVGElement> {
  showBackground?: boolean;
  showBadge?: boolean;
}

/**
 * SnipGeekLogo - Refined version with new coordinates and deep blue gradients.
 * Features dual-tone active states and a precise center pivot.
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
        {/* Light Blue Gradient (Cyan/Sky) */}
        <linearGradient id={`bb5-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd"/>
          <stop offset="100%" stopColor="#0ea5e9"/>
        </linearGradient>
        
        {/* Dark Blue Gradient (Royal/Navy) */}
        <linearGradient id={`bd5-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8"/>
          <stop offset="100%" stopColor="#0c2461"/>
        </linearGradient>

        <style>{`
          .w3-tl-${id} { animation: pulse-a-${id} 3s ease-in-out infinite;       transform-origin: 27px 27px; }
          .w3-br-${id} { animation: pulse-a-${id} 3s ease-in-out 1.5s infinite;  transform-origin: 73px 73px; }
          .w3-tr-${id} { animation: pulse-b-${id} 3s ease-in-out 0.75s infinite; transform-origin: 73px 27px; }
          .w3-bl-${id} { animation: pulse-b-${id} 3s ease-in-out 2.25s infinite; transform-origin: 27px 73px; }
          .w3-dot-${id} { animation: pulse-a-${id} 3s ease-in-out 0.2s infinite; transform-origin: 50px 50px; }

          @keyframes pulse-a-${id} {
            0%, 100% { transform: scale(1); opacity: 1; }
            40%       { transform: scale(1.03); opacity: 0.9; }
            70%       { transform: scale(0.98); }
          }
          @keyframes pulse-b-${id} {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            40%       { transform: scale(0.96); opacity: 0.6; }
            70%       { transform: scale(1.01); opacity: 0.8; }
          }
        `}</style>
      </defs>

      {/* TL: Light Blue - Snipped corner */}
      <polygon 
        className={`w3-tl-${id}`} 
        points="5,5 49,5 49,40 40,49 5,49"
        fill={`url(#bb5-${id})`}
      />

      {/* BR: Light Blue - Snipped corner */}
      <polygon 
        className={`w3-br-${id}`} 
        points="60,51 95,51 95,95 51,95 51,60"
        fill={`url(#bb5-${id})`}
      />

      {/* TR: Dark Blue */}
      <rect className={`w3-tr-${id}`} x="51" y="5" width="44" height="44" rx="4" fill={`url(#bd5-${id})`}/>

      {/* BL: Dark Blue */}
      <rect className={`w3-bl-${id}`} x="5" y="51" width="44" height="44" rx="4" fill={`url(#bd5-${id})`}/>

      {/* Center pivot dot */}
      <circle className={`w3-dot-${id}`} cx="50" cy="50" r="2" fill="#bae6fd" opacity="0.9"/>
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
