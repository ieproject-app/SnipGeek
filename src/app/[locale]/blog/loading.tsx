
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 sm:pt-16 sm:pb-16">
        <header className="mb-16 text-center">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            {[...Array(4)].map((_, i) => (
                <div 
                    key={i} 
                    className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
                    <Skeleton className="w-full aspect-video rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-7 w-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            ))}
          </section>
      </main>
    </div>
  );
}
