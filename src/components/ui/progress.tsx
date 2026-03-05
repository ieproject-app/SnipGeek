"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value?: number;
  className?: string;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, className, indicatorClassName }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-primary/20",
          className,
        )}
      >
        <div
          className={cn(
            "h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out rounded-full",
            indicatorClassName,
          )}
          style={{ transform: `translateX(-${100 - clampedValue}%)` }}
        />
      </div>
    );
  },
);

Progress.displayName = "Progress";

export { Progress };
