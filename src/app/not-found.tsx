import Link from 'next/link';
import { Button } from '@/components/ui/button';
import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['400', '500', '700'],
});

export default function NotFound() {
  return (
    <html lang="en" className={cn(inter.variable, spaceGrotesk.variable)}>
      <head>
        <title>404 - Page Not Found</title>
      </head>
      <body className="font-body antialiased">
        <div className="w-full h-screen flex items-center justify-center bg-background text-foreground">
          <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <header className="mb-8">
                <h1 className="font-headline text-8xl sm:text-9xl font-extrabold tracking-tighter text-primary mb-3">
                    404
                </h1>
                <p className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-primary">
                    Page Not Found
                </p>
            </header>
            <p className="text-muted-foreground mb-8">
                Sorry, we couldn&apos;t find the page you were looking for. It might have been moved or deleted.
            </p>
            <Button asChild>
                <Link href="/">Go Back Home</Link>
            </Button>
          </main>
        </div>
      </body>
    </html>
  );
}
