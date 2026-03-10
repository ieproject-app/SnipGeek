'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useMemo, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    duration?: number;
    distance?: number;
    once?: boolean;
}

export function ScrollReveal({
    children,
    className,
    delay = 0,
    direction = 'up',
    duration = 0.35,
    distance = 20,
    once = true,
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const isInView = useInView(ref, {
        once,
        margin: "0px 0px -15% 0px",
    });

    const initialOffset = useMemo(() => {
        if (prefersReducedMotion || direction === 'none') {
            return { x: 0, y: 0 };
        }

        switch (direction) {
            case 'up': return { y: distance };
            case 'down': return { y: -distance };
            case 'left': return { x: distance };
            case 'right': return { x: -distance };
            default: return { x: 0, y: 0 };
        }
    }, [direction, distance, prefersReducedMotion]);

    const shouldAnimate = !prefersReducedMotion && direction !== 'none';

    return (
        <motion.div
            ref={ref}
            initial={shouldAnimate ? { opacity: 0, ...initialOffset } : false}
            animate={{
                opacity: 1,
                x: isInView ? 0 : initialOffset.x,
                y: isInView ? 0 : initialOffset.y,
            }}
            transition={{
                duration: duration,
                delay: shouldAnimate ? delay : 0,
                ease: [0.21, 0.47, 0.32, 0.98], // cubic-bezier smooth out
            }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}
