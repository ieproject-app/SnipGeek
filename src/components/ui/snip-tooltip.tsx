"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface SnipTooltipProps {
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

export function SnipTooltip({
  label,
  side = "top",
  children,
  className,
  wrapperClassName,
}: SnipTooltipProps) {
  const tooltipPositionClasses = {
    top: "absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 scale-50 translate-y-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0",
    bottom:
      "absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 scale-50 -translate-y-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0",
    left: "absolute top-1/2 -translate-y-1/2 right-full mr-3 opacity-0 scale-50 translate-x-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0",
    right:
      "absolute top-1/2 -translate-y-1/2 left-full ml-3 opacity-0 scale-50 -translate-x-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0",
  };

  const arrowPositionClasses = {
    top: "absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45",
    bottom:
      "absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45",
    left: "absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-primary rotate-45",
    right:
      "absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-primary rotate-45",
  };

  return (
    <span className={cn("relative inline-block group", wrapperClassName)}>
      <span
        className={cn(
          "px-3 py-1.5 rounded-full bg-primary text-primary-foreground",
          "text-[10px] font-black uppercase tracking-widest",
          "shadow-2xl whitespace-nowrap z-50 pointer-events-none",
          "transition-all duration-300",
          tooltipPositionClasses[side],
          className,
        )}
        role="tooltip"
        aria-label={label}
      >
        {label}
        {/* Tooltip Arrow */}
        <span className={arrowPositionClasses[side]} aria-hidden="true" />
      </span>
      {children}
    </span>
  );
}
