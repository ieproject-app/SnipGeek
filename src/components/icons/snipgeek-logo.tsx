import React, { useId } from 'react';

interface SnipGeekLogoProps extends React.SVGProps<SVGSVGElement> {
  showBackground?: boolean;
  showBadge?: boolean;
}

/**
 * SnipGeekLogo - Sharp 4-square animated design.
 * Features a clean pulsing animation with theme-synced colors and sharp corners.
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
            animation: pulseAccent-${id} var(--logo-speed, 2.4s) ease-in-out infinite; 
            transform-origin: 26px 26px; 
          }
          .sq-br-${id} { 
            animation: pulseAccent-${id} var(--logo-speed, 2.4s) ease-in-out calc(var(--logo-speed, 2.4s) / 2) infinite; 
            transform-origin: 74px 74px; 
          }
          .sq-tr-${id} { 
            animation: pulseCurrent-${id} var(--logo-speed, 2.4s) ease-in-out calc(var(--logo-speed, 2.4s) / 4) infinite; 
            transform-origin: 74px 26px; 
          }
          .sq-bl-${id} { 
            animation: pulseCurrent-${id} var(--logo-speed, 2.4s) ease-in-out calc(var(--logo-speed, 2.4s) * 0.75) infinite; 
            transform-origin: 26px 74px; 
          }

          .group-hover\\/logo {
            --logo-speed: 0.8s;
          }

          @keyframes pulseAccent-${id} {
            0%   { transform: scale(1); opacity: 1; }
            35%  { transform: scale(1.06); opacity: 0.9; }
            60%  { transform: scale(0.97); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes pulseCurrent-${id} {
            0%   { transform: scale(1); opacity: 0.7; }
            35%  { transform: scale(0.94); opacity: 0.5; }
            60%  { transform: scale(1.03); opacity: 0.7; }
            100% { transform: scale(1); opacity: 0.7; }
          }
        `}</style>
      </defs>

      {/* Top-left HIGHLIGHT */}
      <rect className={`sq-tl-${id}`} x="4"  y="4"  width="44" height="44" rx="1" fill="hsl(var(--accent))"/>
      {/* Top-right NEUTRAL */}
      <rect className={`sq-tr-${id}`} x="52" y="4"  width="44" height="44" rx="1" fill="currentColor"/>
      {/* Bottom-left NEUTRAL */}
      <rect className={`sq-bl-${id}`} x="4"  y="52" width="44" height="44" rx="1" fill="currentColor"/>
      {/* Bottom-right HIGHLIGHT */}
      <rect className={`sq-br-${id}`} x="52" y="52" width="44" height="44" rx="1" fill="hsl(var(--accent))"/>
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
