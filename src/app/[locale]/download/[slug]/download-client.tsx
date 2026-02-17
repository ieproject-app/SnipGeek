'use client';

import { useEffect, useState } from 'react';
import type { DownloadInfo } from '@/lib/data-downloads';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COUNTDOWN_SECONDS = 5;

interface DownloadClientProps {
  downloadInfo: DownloadInfo;
}

export function DownloadClient({ downloadInfo }: DownloadClientProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsReady(true);
      // Automatically start download when ready
      window.location.href = downloadInfo.externalUrl;
    }
  }, [countdown, downloadInfo.externalUrl]);

  const handleDownload = () => {
    window.location.href = downloadInfo.externalUrl;
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <main className="max-w-lg w-full mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">
                        Preparing Your Download
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center space-y-6">
                    <FileDown className="h-16 w-16 text-primary" strokeWidth={1.5}/>
                    
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            {downloadInfo.fileName}
                        </h2>
                        {downloadInfo.fileSize && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                File Size: {downloadInfo.fileSize}
                            </p>
                        )}
                    </div>

                    <div className="w-full rounded-lg border bg-muted/50 p-4 text-left">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-foreground">Disclaimer:</h4>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    You are being redirected to an external site. SnipGeek is not responsible for the content of third-party sites.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleDownload} 
                        disabled={!isReady}
                        size="lg"
                        className="w-full max-w-sm"
                    >
                        {isReady ? (
                            'Continue to Download'
                        ) : (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Redirecting in {countdown}...
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
