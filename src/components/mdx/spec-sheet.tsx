"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings,
    ChevronRight,
    Cpu,
    Layers,
    Cloud,
    Maximize2,
    Info
} from "lucide-react";

/**
 * SpecList - Premium Container for System Requirements
 */
export const SpecList = ({
    title,
    children,
    defaultOpen = false
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean
}) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div className="my-6 overflow-hidden rounded-2xl border border-primary/10 bg-card/30 backdrop-blur-md shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-4 px-5 text-left transition-colors hover:bg-muted/30"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
                        <Settings className="h-4 w-4" />
                    </div>
                    <span className="font-display text-sm font-black uppercase tracking-widest text-foreground/90">
                        {title}
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-muted-foreground/50"
                >
                    <ChevronRight className="h-4 w-4" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <div className="border-t border-primary/5 p-5 pt-4">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/**
 * SpecItem - Structured item for SpecList
 */
export const SpecItem = ({
    label,
    value,
    icon: Icon
}: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>
}) => {
    // Map common labels to icons if not provided
    const getIcon = () => {
        if (Icon) return <Icon className="h-3.5 w-3.5" />;
        const l = label.toLowerCase();
        if (l.includes("cpu") || l.includes("prosesor")) return <Cpu className="h-3.5 w-3.5" />;
        if (l.includes("ram") || l.includes("memory")) return <Layers className="h-3.5 w-3.5" />;
        if (l.includes("storage") || l.includes("penyimpanan") || l.includes("hard drive")) return <Cloud className="h-3.5 w-3.5" />;
        if (l.includes("gpu") || l.includes("graphics") || l.includes("grafis")) return <Maximize2 className="h-3.5 w-3.5" />;
        return <Info className="h-3.5 w-3.5" />;
    };

    return (
        <div className="flex items-start gap-3 rounded-xl border border-primary/5 bg-background/40 p-3 transition-colors hover:border-primary/10 hover:bg-background/60">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary/60 border border-primary/5">
                {getIcon()}
            </div>
            <div className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 leading-none mb-1">
                    {label}
                </span>
                <span className="block text-xs font-bold text-foreground/90 leading-tight">
                    {value}
                </span>
            </div>
        </div>
    );
};
