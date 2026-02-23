import React, { useId } from 'react';

/**
 * SnipGeekLogo - New animated tech icon logo.
 * Design: Pulsing squares, scan lines, and coding elements with advanced CSS animations.
 * @param showBackground - If true, renders the dark background rect.
 */
export const SnipGeekLogo = ({ 
  className, 
  showBackground = false, 
  ...props 
}: React.SVGProps<SVGSVGElement> & { showBackground?: boolean }) => {
  const id = useId().replace(/:/g, "");
  const clipId = `bg-clip-${id}`;
  const glowId = `innerGlow-${id}`;
  const scanId = `scanGrad-${id}`;

  return (
    <svg
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <style>{`
          /* === Base Squares === */
          .sq-${id} { transform-origin: center center; }
          
          /* Green squares pulse in sequence */
          .sq-tl-${id} {
            animation: pulseGreen-${id} 2.4s ease-in-out infinite;
          }
          .sq-br-${id} {
            animation: pulseGreen-${id} 2.4s ease-in-out 1.2s infinite;
          }
          
          /* Dark squares breathe */
          .sq-tr-${id} {
            animation: pulseDark-${id} 2.4s ease-in-out 0.6s infinite;
          }
          .sq-bl-${id} {
            animation: pulseDark-${id} 2.4s ease-in-out 1.8s infinite;
          }

          @keyframes pulseGreen-${id} {
            0%   { opacity: 1; transform: scale(1); }
            30%  { opacity: 1; transform: scale(1.07); }
            55%  { opacity: 0.85; transform: scale(0.97); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes pulseDark-${id} {
            0%   { opacity: 1; transform: scale(1); }
            30%  { opacity: 0.75; transform: scale(0.94); }
            55%  { opacity: 1; transform: scale(1.04); }
            100% { opacity: 1; transform: scale(1); }
          }

          /* === Corner Dots === */
          .dot-${id} {
            animation: blink-${id} 2.4s ease-in-out infinite;
          }
          .dot-1-${id} { animation-delay: 0s; }
          .dot-2-${id} { animation-delay: 0.6s; }
          .dot-3-${id} { animation-delay: 1.2s; }
          .dot-4-${id} { animation-delay: 1.8s; }
          @keyframes blink-${id} {
            0%, 100% { opacity: 0.3; r: 3; }
            50%       { opacity: 1;   r: 4.5; }
          }

          /* === Scan Line === */
          .scan-${id} {
            animation: scanDown-${id} 3s linear infinite;
          }
          @keyframes scanDown-${id} {
            0%   { transform: translateY(-90px); opacity: 0; }
            10%  { opacity: 0.18; }
            90%  { opacity: 0.18; }
            100% { transform: translateY(90px); opacity: 0; }
          }

          /* === Code Label === */
          .code-label-${id} {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            font-weight: 700;
            fill: #10B981;
            letter-spacing: 0.5px;
          }
          .bracket-left-${id} {
            animation: fadeSlide-${id} 2.4s ease-in-out infinite;
          }
          .bracket-right-${id} {
            animation: fadeSlide-${id} 2.4s ease-in-out 1.2s infinite;
          }
          @keyframes fadeSlide-${id} {
            0%   { opacity: 0.4; transform: translateX(0); }
            40%  { opacity: 1;   transform: translateX(-2px); }
            70%  { opacity: 1;   transform: translateX(0); }
            100% { opacity: 0.4; transform: translateX(0); }
          }

          /* === Cursor blink === */
          .cursor-${id} {
            animation: cursorBlink-${id} 1s step-end infinite;
          }
          @keyframes cursorBlink-${id} {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0; }
          }

          /* === Ring pulse === */
          .ring-${id} {
            fill: none;
            stroke: #10B981;
            stroke-width: 1.5;
            animation: ringPulse-${id} 2.4s ease-out infinite;
            transform-origin: 120px 120px;
          }
          @keyframes ringPulse-${id} {
            0%   { opacity: 0;   transform: scale(0.85); }
            20%  { opacity: 0.35; }
            100% { opacity: 0;   transform: scale(1.12); }
          }

          /* === Outer glow lines (circuit) === */
          .circuit-line-${id} {
            stroke: #10B981;
            stroke-width: 1;
            fill: none;
            animation: circuitFade-${id} 3s ease-in-out infinite;
          }
          .circuit-line-2-${id} { animation-delay: 1.5s; }
          @keyframes circuitFade-${id} {
            0%, 100% { opacity: 0; stroke-dashoffset: 30; }
            40%, 60% { opacity: 0.4; stroke-dashoffset: 0; }
          }
        `}</style>

        <clipPath id={clipId}>
          <rect width="240" height="240" rx="40"/>
        </clipPath>

        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#10B981" stopOpacity="0.07"/>
          <stop offset="100%" stopColor="#111827" stopOpacity="0"/>
        </radialGradient>

        <linearGradient id={scanId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#10B981" stopOpacity="0"/>
          <stop offset="50%"  stopColor="#10B981" stopOpacity="1"/>
          <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="240" height="240" rx="40" fill="#111827"/>
      <rect width="240" height="240" rx="40" fill={`url(#${glowId})`}/>

      {/* Ring pulse (behind squares) */}
      <rect className={`ring-${id}`} x="72" y="72" width="96" height="96" rx="6"/>

      {/* Circuit decorations top-left */}
      <path className={`circuit-line-${id}`} strokeDasharray="20,5" d="M 56 84 L 44 84 L 44 70"/>
      {/* Circuit decorations bottom-right */}
      <path className={`circuit-line-${id} circuit-line-2-${id}`} strokeDasharray="20,5" d="M 184 156 L 196 156 L 196 170"/>

      {/* === 4 Main Squares === */}
      <g className={`sq-${id} sq-tl-${id}`} style={{ transformOrigin: '90px 90px' }}>
        <rect x="72" y="72" width="44" height="44" rx="6" fill="#10B981"/>
      </g>

      <g className={`sq-${id} sq-tr-${id}`} style={{ transformOrigin: '150px 90px' }}>
        <rect x="124" y="72" width="44" height="44" rx="6" fill="#1F2E42"/>
      </g>

      <g className={`sq-${id} sq-bl-${id}`} style={{ transformOrigin: '90px 150px' }}>
        <rect x="72" y="124" width="44" height="44" rx="6" fill="#1F2E42"/>
      </g>

      <g className={`sq-${id} sq-br-${id}`} style={{ transformOrigin: '150px 150px' }}>
        <rect x="124" y="124" width="44" height="44" rx="6" fill="#10B981"/>
      </g>

      {/* === Scan line over all squares === */}
      <g clipPath={`url(#${clipId})`}>
        <rect className={`scan-${id}`} x="72" y="115" width="96" height="4" rx="2" fill={`url(#${scanId})`}/>
      </g>

      {/* === Corner accent dots === */}
      <circle className={`dot-${id} dot-1-${id}`} cx="62"  cy="62"  r="3" fill="#10B981"/>
      <circle className={`dot-${id} dot-2-${id}`} cx="178" cy="62"  r="3" fill="#10B981"/>
      <circle className={`dot-${id} dot-3-${id}`} cx="178" cy="178" r="3" fill="#10B981"/>
      <circle className={`dot-${id} dot-4-${id}`} cx="62"  cy="178" r="3" fill="#10B981"/>

      {/* === Code Label below squares === */}
      <text className={`code-label-${id} bracket-left-${id}`} x="78"  y="202">&lt;</text>
      <text className={`code-label-${id}`} x="93"  y="202" opacity="0.9">/</text>
      <text className={`code-label-${id} bracket-right-${id}`} x="102" y="202">&gt;</text>
      <rect className={`cursor-${id}`} x="118" y="190" width="2.5" height="13" rx="1" fill="#10B981"/>

      <text fontFamily="'Courier New', monospace" fontSize="9" fill="#10B981" opacity="0.45" x="126" y="202" letterSpacing="1">snip</text>
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
