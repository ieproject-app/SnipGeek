'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';
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
    duration = 0.5,
    distance = 40,
    once = true,
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    // Menggunakan useInView dengan margin asimetris: 
    // Memicu elemen sedikit sebelum masuk utuh ke viewport bawah
    const isInView = useInView(ref, { once, margin: "0px 0px -10% 0px" });

    const getDirectionOffset = () => {
        switch (direction) {
            case 'up': return { y: distance };
            case 'down': return { y: -distance };
            case 'left': return { x: distance };
            case 'right': return { x: -distance };
            default: return { x: 0, y: 0 };
        }
    };

    const initialOffset = getDirectionOffset();

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: direction === 'none' ? 1 : 0, ...initialOffset }}
            animate={{
                opacity: isInView ? 1 : (direction === 'none' ? 1 : 0),
                x: isInView ? 0 : initialOffset.x,
                y: isInView ? 0 : initialOffset.y,
            }}
            transition={{
                duration: duration,
                delay: delay,
                ease: [0.21, 0.47, 0.32, 0.98], // cubic-bezier smooth out
            }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}
