"use client";

import React, { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

type SnipGeekLogoProps = React.SVGProps<SVGSVGElement> & {
  /** Disable the draw-on animation (e.g. inside dropdowns where it loops awkwardly). */
  noAnimate?: boolean;
};

/**
 * SnipGeekLogo — single-path aperture mark.
 *
 * Geometry: an outer ring with 3 inward triangular blade indents at the 12,
 * 4, and 8 o'clock positions, drawn as one continuous closed path. The shape
 * preserves the original 3-fold rotational symmetry but is now traceable in
 * a single stroke — which lets us animate the draw on mount the same way
 * threads.com does with its `@` logo.
 *
 * Coordinates assume a 100×100 viewBox centered at (50, 50) with ring
 * radius 42 and blade tips reaching to a small inner radius (4) toward the
 * center, leaving a tiny iris hole.
 */
const APERTURE_PATH =
  "M 60.87 9.43 " +
  "A 42 42 0 0 1 90.57 60.87 " +
  "L 53.46 52 " +
  "L 79.7 79.7 " +
  "A 42 42 0 0 1 20.3 79.7 " +
  "L 46.54 52 " +
  "L 9.43 60.87 " +
  "A 42 42 0 0 1 39.13 9.43 " +
  "L 50 46 " +
  "Z";

export const SnipGeekLogo = ({
  className,
  noAnimate,
  ...props
}: SnipGeekLogoProps) => {
  const id = useId().replace(/:/g, "");
  const gradId = `sg-grad-${id}`;

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const strokeColor = isDark ? "#ffffff" : `url(#${gradId})`;

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <defs>
        {!isDark && (
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        )}
        {!noAnimate && (
          <style>{`
            @keyframes sg-${id} {
              from { stroke-dashoffset: 100; }
              to { stroke-dashoffset: 0; }
            }
            .sg-draw-${id} {
              stroke-dasharray: 100;
              stroke-dashoffset: 100;
              animation: sg-${id} 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
            }
            @media (prefers-reduced-motion: reduce) {
              .sg-draw-${id} {
                animation: none;
                stroke-dashoffset: 0;
              }
            }
          `}</style>
        )}
      </defs>

      <path
        d={APERTURE_PATH}
        pathLength={100}
        fill="none"
        stroke={strokeColor}
        strokeWidth={6}
        strokeLinejoin="round"
        strokeLinecap="round"
        className={noAnimate ? undefined : `sg-draw-${id}`}
      />
    </svg>
  );
};

SnipGeekLogo.displayName = "SnipGeekLogo";
