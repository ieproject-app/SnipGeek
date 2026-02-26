
'use client';

import { usePathname } from 'next/navigation';
import { Facebook, Linkedin, Send } from 'lucide-react';
import { XLogo } from '@/components/icons/x-logo';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  title: string;
  imageUrl?: string;
}

// TODO: Replace with your actual production domain
const productionUrl = 'https://snipgeek.com';

export function ShareButtons({ title, imageUrl }: ShareButtonsProps) {
  const pathname = usePathname();
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Ensure this runs only on the client
    setCurrentUrl(`${productionUrl}${pathname}`);
  }, [pathname]);

  if (!currentUrl) {
    return null; 
  }

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareButtons = [
    {
      id: 'twitter',
      label: 'X',
      icon: XLogo,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      hoverClass: "hover:bg-foreground hover:text-background",
      shadowClass: "group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] dark:group-hover:shadow-[0_8px_20px_rgba(255,255,255,0.1)]",
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      hoverClass: "hover:bg-[#1877F2] hover:text-white",
      shadowClass: "group-hover:shadow-[0_8px_20px_rgba(24,119,242,0.4)]",
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      hoverClass: "hover:bg-[#0A66C2] hover:text-white",
      shadowClass: "group-hover:shadow-[0_8px_20px_rgba(10,102,194,0.4)]",
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: Send,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      hoverClass: "hover:bg-[#229ED9] hover:text-white",
      shadowClass: "group-hover:shadow-[0_8px_20px_rgba(34,158,217,0.4)]",
    },
  ];

  return (
    <div className="group/container relative flex items-center justify-center p-1.5 rounded-2xl border border-primary/10 bg-card/30 backdrop-blur-md shadow-sm max-w-sm mx-auto">
      {shareButtons.map((btn, index) => (
        <div key={btn.id} className="flex items-center flex-1">
          <a 
            href={btn.href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={cn(
              "group relative flex flex-1 flex-col items-center justify-center py-4 px-2 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              "text-muted-foreground hover:-translate-y-1.5 hover:scale-110 hover:rotate-3",
              btn.hoverClass,
              btn.shadowClass
            )}
            aria-label={`Share on ${btn.label}`}
          >
            {/* Animated Tooltip */}
            <span className={cn(
                "absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-2xl",
                "opacity-0 scale-50 translate-y-4 transition-all duration-300 pointer-events-none z-20",
                "group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
            )}>
                {btn.label}
                {/* Tooltip Arrow */}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
            </span>

            <btn.icon className="h-5 w-5 transition-transform duration-300" />
          </a>
          
          {/* Animated Divider */}
          {index < shareButtons.length - 1 && (
            <div className="w-px h-8 bg-primary/10 transition-opacity duration-300 group-hover/container:opacity-0" />
          )}
        </div>
      ))}
    </div>
  );
}
