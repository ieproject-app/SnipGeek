"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function LayoutBackToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let previousScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Muncul jika:
            // 1. Sudah scroll cukup jauh (> 600px)
            // 2. Sedang scroll ke atas (current < last)
            // 3. User tidak sedang benar-benar di paling bawah (opsional, tapi lebih baik)
            if (currentScrollY > 600 && currentScrollY < previousScrollY) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }

            previousScrollY = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-8 left-1/2 z-60",
                "flex items-center gap-2.5 px-5 py-2 rounded-full",
                "bg-background/60 backdrop-blur-xl border border-primary/10",
                "shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
                "text-[10px] font-black uppercase tracking-[0.2em] text-accent/80 hover:text-accent",
                "transition-all duration-300 hover:scale-105 active:scale-95 hover:border-accent/30 hover:bg-background/80",
                isVisible
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "translate-y-5 opacity-0 pointer-events-none",
                "-translate-x-1/2"
            )}
            aria-label="Back to top"
        >
            <ArrowUp className="h-3.5 w-3.5" strokeWidth={3} />
            <span>Back to Top</span>
        </button>
    );
}
