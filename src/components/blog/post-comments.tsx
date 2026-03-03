
'use client';

import { DiscussionEmbed } from 'disqus-react';
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const productionHostname = 'snipgeek.com'; 
const disqusShortname = 'snipgeek-com';

interface PostCommentsProps {
  article: {
    slug: string;
    title: string;
  };
  type: 'blog' | 'note';
  locale: string;
}

export function PostComments({ article, type, locale }: PostCommentsProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [mounted, setMounted] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Logic to ensure Disqus ONLY loads in production environment AND on the correct domain
    const isProduction = process.env.NODE_ENV === 'production';
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const isCorrectDomain = typeof window !== 'undefined' && window.location.hostname === productionHostname;
        
        if (isProduction && isCorrectDomain) {
          setShouldLoad(true);
        }
        // Disconnect the observer once it has done its job
        observer.disconnect();
      }
    });

    if (commentsRef.current) {
      observer.observe(commentsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Display a skeleton placeholder if not yet loaded or not on production site
  if (!shouldLoad) {
    return (
      <div ref={commentsRef} className="border-t mt-16 pt-12 space-y-8 animate-in fade-in duration-700">
        <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full rounded-xl" />
            </div>
        </div>
        <div className="space-y-6 pl-14">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 opacity-50">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-30 pt-4">
            {!mounted 
              ? 'Loading Conversation...' 
              : (process.env.NODE_ENV === 'production' && window.location.hostname === productionHostname) 
                ? 'Loading Conversation...' 
                : `Comments are disabled in Development Mode. Available on ${productionHostname}`}
        </p>
      </div>
    );
  }

  // Construct the canonical URL for the article based on its type
  const canonicalUrl = `https://${productionHostname}/${type}/${article.slug}`;

  return (
    <div className="border-t mt-16 pt-12">
        <DiscussionEmbed
            shortname={disqusShortname}
            config={{
                url: canonicalUrl,
                identifier: article.slug,
                title: article.title,
                language: locale,
            }}
        />
    </div>
  );
}
