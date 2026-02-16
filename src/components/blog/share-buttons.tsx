'use client';

import { usePathname } from 'next/navigation';
import { Facebook, Linkedin, Pinterest } from 'lucide-react';
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
  const encodedImageUrl = imageUrl ? encodeURIComponent(imageUrl) : '';

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImageUrl}&description=${encodedTitle}`,
  };

  return (
    <div className="flex items-center justify-center rounded-lg border bg-card">
      <a 
        href={shareLinks.twitter} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="p-4 text-muted-foreground transition-colors hover:text-primary"
        aria-label="Share on X"
      >
        <XLogo className="h-5 w-5" />
      </a>
      <div className="h-6 w-px bg-border" />
      <a 
        href={shareLinks.facebook} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="p-4 text-muted-foreground transition-colors hover:text-primary"
        aria-label="Share on Facebook"
      >
        <Facebook className="h-5 w-5" />
      </a>
      <div className="h-6 w-px bg-border" />
      <a 
        href={shareLinks.linkedin} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="p-4 text-muted-foreground transition-colors hover:text-primary"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-5 w-5" />
      </a>
      {imageUrl && (
        <>
            <div className="h-6 w-px bg-border" />
            <a 
                href={shareLinks.pinterest} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 text-muted-foreground transition-colors hover:text-primary"
                aria-label="Share on Pinterest"
            >
                <Pinterest className="h-5 w-5" />
            </a>
        </>
      )}
    </div>
  );
}
