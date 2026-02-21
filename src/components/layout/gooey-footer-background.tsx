'use client';

import React, { useEffect, useState } from 'react';

/**
 * GooeyFooterBackground Component
 * Creates an active "boiling/floating" liquid effect using SVG filters and dynamic particles.
 * Based on the reference: Particles float up from the footer edge and merge.
 */
export function GooeyFooterBackground() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate particles only once on client-side to avoid hydration mismatch
    const particleCount = 60;
    const p = [];
    for (let i = 0; i < particleCount; i++) {
      p.push({
        id: i,
        size: 2 + Math.random() * 5, // 2rem to 7rem
        uplift: 10 + Math.random() * 15, // float up distance
        posX: Math.random() * 100, // horizontal position
        dur: 3 + Math.random() * 4, // 3s to 7s duration
        delay: -(Math.random() * 10), // negative delay for immediate start
      });
    }
    setParticles(p);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-24 -translate-y-[98%] pointer-events-none overflow-visible z-0">
      <style>{`
        @keyframes gooey-float-up {
          0% {
            top: 100%;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            top: calc(var(--uplift) * -1);
            transform: translate(-50%, -50%) scale(0);
          }
        }
        .gooey-liquid-container {
          filter: url('#footer-liquid-effect');
        }
      `}</style>

      {/* The base pool and floating particles */}
      <div className="gooey-liquid-container relative w-full h-full bg-primary">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-primary"
            style={{
              left: `${p.posX}%`,
              width: `${p.size}rem`,
              height: `${p.size}rem`,
              '--uplift': `${p.uplift}rem`,
              animation: `gooey-float-up ${p.dur}s ease-in infinite`,
              animationDelay: `${p.delay}s`,
            } as any}
          />
        ))}
      </div>

      {/* SVG Filter Definition */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="footer-liquid-effect">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" 
              result="gooey" 
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop"/>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
