'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Link from 'next/link';

interface DownloadButtonProps {
  href: string;
  children: React.ReactNode;
}

export function DownloadButton({ href, children }: DownloadButtonProps) {
  if (!href) {
    return null;
  }
  
  const downloadGateUrl = `/download?url=${encodeURIComponent(href)}`;

  return (
    <div className="my-6">
        <Button asChild size="lg">
            <Link href={downloadGateUrl} rel="noopener nofollow">
                <Download className="mr-2 h-5 w-5" />
                {children}
            </Link>
        </Button>
    </div>
  );
}
