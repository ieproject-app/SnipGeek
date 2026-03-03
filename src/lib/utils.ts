import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date into a relative time string (e.g., "2 hours ago", "3 days ago").
 * Handles invalid dates gracefully to prevent SSR crashes.
 */
export function formatRelativeTime(date: Date, locale: string = 'en') {
  if (!date || isNaN(date.getTime())) {
    return 'N/A';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) return rtf.format(-diffInSeconds, 'second');
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) return rtf.format(-diffInMinutes, 'minute');
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) return rtf.format(-diffInHours, 'hour');
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (Math.abs(diffInDays) < 30) return rtf.format(-diffInDays, 'day');
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (Math.abs(diffInMonths) < 12) return rtf.format(-diffInMonths, 'month');
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return rtf.format(-diffInYears, 'year');
  } catch (e) {
    return date.toLocaleDateString(locale);
  }
}
