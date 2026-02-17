'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, LoaderCircle, AlertTriangle } from 'lucide-react';
import type { Dictionary } from '@/lib/get-dictionary';
import Link from 'next/link';

export function DownloadClient({ dictionary }: { dictionary: Dictionary['downloadGate'] }) {
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  // Consolidate state into a single status object
  const [status, setStatus] = useState<{
    type: 'loading' | 'valid' | 'invalid';
    url: string | null;
  }>({ type: 'loading', url: null });

  useEffect(() => {
    const urlFromParams = searchParams.get('url');

    // Basic validation
    if (urlFromParams && (urlFromParams.startsWith('http://') || urlFromParams.startsWith('https://'))) {
      setStatus({ type: 'valid', url: urlFromParams });

      // If valid, start the countdown timer
      const interval = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(interval);
            window.location.href = urlFromParams; // Redirect when countdown is over
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);

      // Cleanup function to clear interval if the component unmounts
      return () => clearInterval(interval);
    } else {
      // If URL is missing or invalid
      setStatus({ type: 'invalid', url: urlFromParams });
    }
    // Dependency array ensures this effect runs once when searchParams are available
  }, [searchParams]);

  // Render loading state
  if (status.type === 'loading') {
    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-background">
            <main className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle>{dictionary.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LoaderCircle className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }

  // Render invalid URL state
  if (status.type === 'invalid') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-destructive">
                        <AlertTriangle />
                        {dictionary.invalidUrl.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{dictionary.invalidUrl.description}</p>
                     <Button asChild variant="outline" className="mt-4">
                        <Link href="/">Go Home</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
      </div>
    );
  }
  
  // Render valid URL / countdown state
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <main className="max-w-lg w-full mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>{dictionary.title}</CardTitle>
                    <CardDescription>{dictionary.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-sm truncate text-muted-foreground break-all">
                        {status.url}
                    </div>
                    {countdown > 0 ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                            <p>{dictionary.redirectingIn.replace('{countdown}', countdown.toString())}</p>
                        </div>
                    ) : (
                        <p className="text-primary font-semibold">{dictionary.redirectingNow}</p>
                    )}
                    <Button asChild size="lg" className="w-full">
                        <a href={status.url!}>
                            <ExternalLink className="mr-2 h-5 w-5" />
                            {dictionary.continueButton}
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
