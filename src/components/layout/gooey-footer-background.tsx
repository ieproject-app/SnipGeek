'use client';

import React, { useEffect, useState } from 'react';

/**
 * GooeyFooterBackground Component
 * Dioptimalkan untuk alur yang lebih natural dan integrasi tanpa celah dengan basis footer solid.
 */
export function GooeyFooterBackground() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Jumlah partikel dikurangi untuk kesan yang lebih bersih dan premium
    const particleCount = 20; 
    const p = [];
    for (let i = 0; i < particleCount; i++) {
      p.push({
        id: i,
        size: 2 + Math.random() * 4, // 2rem hingga 6rem
        uplift: 3 + Math.random() * 5, // Jarak terbang yang lebih pendek dan halus
        posX: Math.random() * 100,
        dur: 6 + Math.random() * 6, // Gerakan lebih lambat agar terlihat "kental"
        delay: -(Math.random() * 10),
      });
    }
    setParticles(p);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-20 -translate-y-full pointer-events-none z-0" style={{ contain: 'paint' }}>
      <style>{`
        @keyframes gooey-float-up {
          0% {
            transform: translate(-50%, 0) scale(1);
            top: 100%;
          }
          50% {
            transform: translate(-50%, -10%) scale(1.05);
          }
          100% {
            transform: translate(-50%, -100%) scale(0);
            top: calc(100% - var(--uplift));
          }
        }
        .gooey-liquid-wrapper {
          filter: url('#footer-gooey-filter-v3');
          height: 100%;
          width: 100%;
          position: relative;
        }
      `}</style>

      <div className="gooey-liquid-wrapper">
        {/* Kolam Cairan Sumber - Dibuat overlap dengan footer agar tidak ada garis pembatas tajam */}
        <div className="absolute bottom-[-8px] left-0 w-full h-12 bg-primary" />
        
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-primary will-change-transform"
            style={{
              left: `${p.posX}%`,
              width: `${p.size}rem`,
              height: `${p.size}rem`,
              '--uplift': `${p.uplift}rem`,
              animation: `gooey-float-up ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            } as any}
          />
        ))}
      </div>

      {/* SVG Filter Definition - Refined for "Natural Melt" */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="footer-gooey-filter-v3">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" 
              result="gooey" 
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
