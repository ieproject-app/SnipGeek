"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface LegalPageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background">
      <Card className="w-full max-w-4xl shadow-lg font-body">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-headline tracking-tight">{title}</CardTitle>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToApp')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none text-foreground/90">
          {children}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground w-full text-center">
            © {new Date().getFullYear()} Pickster. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}