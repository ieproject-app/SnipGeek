
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="w-full">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <article className="animate-in fade-in duration-700">
            <header className="text-center mb-8">
                <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
            </header>

            <div className="relative my-8 sm:my-12 rounded-2xl overflow-hidden shadow-2xl">
                <Skeleton className="w-full aspect-video" />
            </div>

            <div className="flex justify-between items-center py-4 mb-8 border-b border-primary/5">
                <div className="flex gap-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-5 w-16" />
            </div>

            <div className="my-8 rounded-xl border bg-muted/30 p-4">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>
            </div>
            
            <div className="space-y-6 mt-12">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </article>
      </main>
    </div>
  );
}
