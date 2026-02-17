'use client';

import { useEffect, useState } from 'react';
import type { DownloadInfo } from '@/lib/data-downloads';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import type { Dictionary } from '@/lib/get-dictionary';

const COUNTDOWN_SECONDS = 5;

interface DownloadClientProps {
  downloadInfo: DownloadInfo;
  dictionary: Dictionary['downloadGate'];
}

export function DownloadClient({ downloadInfo, dictionary }: DownloadClientProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (countdown > 1) {
            setCountdown(prev => prev - 1);
        } else {
            window.location.href = downloadInfo.externalUrl;
        }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, downloadInfo.externalUrl]);

  const handleDownloadClick = () => {
    window.location.href = downloadInfo.externalUrl;
  };

  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16 text-center">
        <FileDown className="h-20 w-20 text-primary mx-auto mb-6" strokeWidth={1.5}/>
        
        <header className="mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-3">
                {dictionary.title}
            </h1>
            <p className="text-xl text-muted-foreground">{downloadInfo.fileName}</p>
            {downloadInfo.fileSize && (
                <p className="mt-1 text-sm text-muted-foreground">
                    {dictionary.fileSizeLabel} {downloadInfo.fileSize}
                </p>
            )}
        </header>

        <div className="flex flex-col items-center gap-4">
            <Button 
                onClick={handleDownloadClick} 
                size="lg"
                className="w-full max-w-xs"
            >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {dictionary.continueButton} ({countdown})
            </Button>
            <p className="text-xs text-muted-foreground">
                {dictionary.redirecting.replace('{countdown}', countdown.toString())}
            </p>
        </div>
      </main>
    </div>
  );
}
