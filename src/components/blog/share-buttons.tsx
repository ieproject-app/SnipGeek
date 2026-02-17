'use client';

import { usePathname } from 'next/navigation';
import { Facebook, Linkedin, Send } from 'lucide-react';
import { XLogo } from '@/components/icons/x-logo';
import { useState, useEffect } from 'react';

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
    return null; // Or a loading skeleton
  }

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };

  return (
    <div className="flex rounded-xl border bg-card/50 overflow-hidden">
      <a 
        href={shareLinks.twitter} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex flex-1 items-center justify-center p-4 text-muted-foreground transition-colors duration-300 ease-in-out hover:bg-muted hover:text-accent-foreground"
        aria-label="Share on X"
      >
        <XLogo className="h-5 w-5" />
      </a>
      <div className="w-px bg-border" />
      <a 
        href={shareLinks.facebook} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex flex-1 items-center justify-center p-4 text-muted-foreground transition-colors duration-300 ease-in-out hover:bg-muted hover:text-accent-foreground"
        aria-label="Share on Facebook"
      >
        <Facebook className="h-5 w-5" />
      </a>
      <div className="w-px bg-border" />
      <a 
        href={shareLinks.linkedin} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex flex-1 items-center justify-center p-4 text-muted-foreground transition-colors duration-300 ease-in-out hover:bg-muted hover:text-accent-foreground"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-5 w-5" />
      </a>
      <div className="w-px bg-border" />
      <a 
          href={shareLinks.telegram} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex flex-1 items-center justify-center p-4 text-muted-foreground transition-colors duration-300 ease-in-out hover:bg-muted hover:text-accent-foreground"
          aria-label="Share on Telegram"
      >
          <Send className="h-5 w-5" />
      </a>
    </div>
  );
}
