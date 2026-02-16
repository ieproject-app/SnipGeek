'use client';

import { DiscussionEmbed } from 'disqus-react';
import { useState, useEffect, useRef } from 'react';

// TODO: Replace with your actual production domain and Disqus shortname
const productionHostname = 'snipgeek.com'; 
const disqusShortname = 'snipgeek-com';

interface PostCommentsProps {
  article: {
    slug: string;
    title: string;
  };
  locale: string;
}

export function PostComments({ article, locale }: PostCommentsProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This logic ensures that Disqus is only loaded on the production domain
    // and when the comments section is scrolled into view (lazy-loading).
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (window.location.hostname === productionHostname) {
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

  // Display a placeholder if not on the production site or not yet in view
  if (!shouldLoad) {
    return (
      <div ref={commentsRef} className="text-center py-12 text-muted-foreground border-t mt-16">
        <p>Comments are only available on the production site ({productionHostname}).</p>
      </div>
    );
  }

  // Construct the canonical URL for the article
  const canonicalUrl = `https://${productionHostname}/blog/${article.slug}`;

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
