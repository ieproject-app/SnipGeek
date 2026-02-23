import React, { useId } from 'react';

interface SnipGeekLogoProps extends React.SVGProps<SVGSVGElement> {
  showBackground?: boolean;
  showBadge?: boolean;
}

/**
 * SnipGeekLogo - Latest minimalist 4-square animated design.
 * Features a clean pulsing animation for tech-focused identity.
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
        <style>{`
          .sq-tl-${id} { 
            animation: pulseGreen-${id} 2.4s ease-in-out infinite; 
            transform-origin: 25px 25px; 
          }
          .sq-br-${id} { 
            animation: pulseGreen-${id} 2.4s ease-in-out 1.2s infinite; 
            transform-origin: 75px 75px; 
          }
          .sq-tr-${id} { 
            animation: pulseDark-${id} 2.4s ease-in-out 0.6s infinite; 
            transform-origin: 75px 25px; 
          }
          .sq-bl-${id} { 
            animation: pulseDark-${id} 2.4s ease-in-out 1.8s infinite; 
            transform-origin: 25px 75px; 
          }

          @keyframes pulseGreen-${id} {
            0%   { transform: scale(1); }
            35%  { transform: scale(1.08); }
            60%  { transform: scale(0.96); }
            100% { transform: scale(1); }
          }
          @keyframes pulseDark-${id} {
            0%   { transform: scale(1); }
            35%  { transform: scale(0.92); }
            60%  { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}</style>
      </defs>

      {/* Top-left GREEN */}
      <rect className={`sq-tl-${id}`} x="4"  y="4"  width="44" height="44" rx="6" fill="#10B981"/>
      {/* Top-right DARK */}
      <rect className={`sq-tr-${id}`} x="52" y="4"  width="44" height="44" rx="6" fill="#111827"/>
      {/* Bottom-left DARK */}
      <rect className={`sq-bl-${id}`} x="4"  y="52" width="44" height="44" rx="6" fill="#111827"/>
      {/* Bottom-right GREEN */}
      <rect className={`sq-br-${id}`} x="52" y="52" width="44" height="44" rx="6" fill="#10B981"/>
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
