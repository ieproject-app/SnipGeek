
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Search, Home, BookOpen, PenTool } from 'lucide-react';

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
        <title>404 - Page Not Found | SnipGeek</title>
        <meta name="description" content="Sorry, the page you're looking for doesn't exist. Find tutorials, notes, and tech tools at SnipGeek." />
      </head>
      <body className="font-body antialiased">
        <div className="w-full min-h-screen flex items-center justify-center bg-background text-foreground py-20">
          <main className="max-w-xl mx-auto px-6 text-center">
            <header className="mb-8">
                <h1 className="font-headline text-8xl sm:text-9xl font-extrabold tracking-tighter text-primary mb-3">
                    404
                </h1>
                <p className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-primary">
                    Lost in Space?
                </p>
            </header>
            
            <p className="text-muted-foreground mb-12 text-lg">
                The page you are looking for might have been moved or deleted. Let's get you back on track.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                <Button asChild variant="outline" size="lg" className="rounded-xl h-16">
                    <Link href="/">
                        <Home className="mr-2 h-5 w-5" />
                        Go Back Home
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl h-16">
                    <Link href="/blog">
                        <BookOpen className="mr-2 h-5 w-5" />
                        Browse Blog
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl h-16">
                    <Link href="/notes">
                        <PenTool className="mr-2 h-5 w-5" />
                        Read Notes
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl h-16">
                    <Link href="/tools">
                        <Search className="mr-2 h-5 w-5" />
                        Explore Tools
                    </Link>
                </Button>
            </div>

            <p className="text-sm text-muted-foreground border-t pt-8 italic">
              "Technology is best when it brings people together... or when it actually works."
            </p>
          </main>
        </div>
      </body>
    </html>
  );
}

    