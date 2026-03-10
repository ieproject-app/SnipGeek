"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Info, HelpCircle, Folder, AlertTriangle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type ExpandableIcon = "info" | "help" | "folder" | "warning" | "tip";

const iconMap: Record<ExpandableIcon, React.ElementType> = {
    info: Info,
    help: HelpCircle,
    folder: Folder,
    warning: AlertTriangle,
    tip: Lightbulb,
};

interface ExpandableProps {
    title: string;
    icon?: ExpandableIcon;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

/**
 * Expandable - A premium animated accordion component for MDX.
 * Replaces standard HTML details to avoid Prose styling conflicts.
 */
export const Expandable = ({
    title,
    icon,
    children,
    defaultOpen = false,
    className,
}: ExpandableProps) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    const IconComponent = icon ? iconMap[icon] : null;

    return (
        <div
            className={cn(
                "group my-6 overflow-hidden rounded-2xl border transition-all duration-300",
                isOpen
                    ? "border-primary/20 bg-card/40 shadow-md ring-1 ring-primary/5"
                    : "border-primary/10 bg-card/20 hover:border-primary/20 hover:bg-card/30 shadow-sm",
                className
            )}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-4 px-5 text-left focus:outline-none"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3.5">
                    <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300",
                        isOpen
                            ? "border-accent/20 bg-accent/10 text-accent"
                            : "border-primary/10 bg-primary/5 text-primary/60"
                    )}>
                        {IconComponent ? <IconComponent className="h-4 w-4" /> : (
                            <ChevronRight className={cn(
                                "h-4 w-4 transition-transform duration-500 ease-[0.23,1,0.32,1]",
                                isOpen && "rotate-90"
                            )} />
                        )}
                    </div>
                    <span className="font-display text-[15px] font-bold tracking-tight text-foreground/90">
                        {title}
                    </span>
                </div>

                {IconComponent && (
                    <div className="ml-4 text-muted-foreground/30">
                        <ChevronRight className={cn(
                            "h-4 w-4 transition-transform duration-500 ease-[0.23,1,0.32,1]",
                            isOpen && "rotate-90"
                        )} />
                    </div>
                )}
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: "auto",
                            opacity: 1,
                            transition: {
                                height: {
                                    duration: 0.4,
                                    ease: [0.23, 1, 0.32, 1]
                                },
                                opacity: {
                                    duration: 0.25,
                                    delay: 0.1
                                }
                            }
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                                height: {
                                    duration: 0.3,
                                    ease: [0.23, 1, 0.32, 1]
                                },
                                opacity: {
                                    duration: 0.2
                                }
                            }
                        }}
                    >
                        <div className="border-t border-primary/5 p-5 px-6 pt-4 text-[15px] leading-relaxed text-foreground/80">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
