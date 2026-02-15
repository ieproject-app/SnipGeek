import Link from 'next/link';
import { Button } from '@/components/ui/button';
import './globals.css';

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 - Page Not Found</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
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
