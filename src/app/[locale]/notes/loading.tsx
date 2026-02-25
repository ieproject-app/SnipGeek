
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="mb-16 text-center">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {[...Array(4)].map((_, i) => (
            <Card 
                key={i} 
                className="bg-card/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${i * 100}ms` }}
            >
                <CardHeader className="p-6 pb-0 flex-row justify-between items-start space-y-0">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent className="p-6 pt-4">
                    <Skeleton className="h-3 w-20 mb-3" />
                    <Skeleton className="h-6 w-full mb-3" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </CardContent>
                <CardFooter className="px-6 py-4 border-t bg-muted/5 flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </CardFooter>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
