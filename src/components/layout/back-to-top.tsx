"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/get-dictionary";
import { SnipTooltip } from "@/components/ui/snip-tooltip";

export function BackToTop({ dictionary }: { dictionary: Dictionary }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      <SnipTooltip
        label={
          dictionary?.promptGenerator?.tooltips?.backToTop || "Back to Top"
        }
        side="left"
      >
        <Button
          variant="default"
          size="icon"
          className="relative inline-flex rounded-full h-10 w-10 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-primary/90 text-primary-foreground border-none"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </SnipTooltip>
    </div>
  );
}
