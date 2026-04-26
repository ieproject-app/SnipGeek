"use client";

import React, { useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

type SnipGeekLogoProps = React.SVGProps<SVGSVGElement>;

/**
 * SnipGeekLogo - Aperture-style mark with 3 triangular blades,
 * a solid outer ring, and a center focal dot.
 *
 * Renders the Light or Dark variant based on the resolved theme from
 * next-themes (class-based). Falls back to the Light variant during SSR
 * and before hydration to avoid flash/invisible logo.
 */
export const SnipGeekLogo = ({
  className,
  ...props
}: SnipGeekLogoProps) => {
  const id = useId().replace(/:/g, "");
  const gradId = `sg-grad-${id}`;

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  // Blade polygon: apex at outer ring (50, 14), narrow base near center.
  // Rotated 0°, 120°, 240° for a 3-blade aperture.
  const bladePoints = "50,14 42,40 58,40";

  const strokeColor = isDark ? "white" : `url(#${gradId})`;
  const fillColor = isDark ? "white" : `url(#${gradId})`;
  const dotColor = isDark ? "white" : "#bae6fd";
  const dotOpacity = isDark ? 0.9 : 1;

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {!isDark && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
      )}

      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke={strokeColor}
        strokeWidth="5"
      />

      {/* 3 triangular blades */}
      <g
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinejoin="round"
      >
        <polygon points={bladePoints} />
        <polygon points={bladePoints} transform="rotate(120 50 50)" />
        <polygon points={bladePoints} transform="rotate(240 50 50)" />
      </g>

      {/* Center focal dot */}
      <circle cx="50" cy="50" r="5" fill={dotColor} fillOpacity={dotOpacity} />
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
