
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pb-16">
        <header className="mb-12 text-center">
          <Skeleton className="h-11 w-44 mx-auto mb-3" />
          <Skeleton className="h-6 w-full max-w-xl mx-auto" />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative w-full aspect-8/5 overflow-hidden rounded-xl border border-primary/5 mb-4">
                <Skeleton className="absolute inset-0" />
                <Skeleton className="absolute top-3 right-3 h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full mb-2" />
              <Skeleton className="h-5 w-[92%]" />
              <Skeleton className="h-5 w-[78%]" />
              <Skeleton className="h-3 w-20 mt-2" />
            </div>
          ))}
        </section>

        <div className="mt-12 flex justify-center">
          <Skeleton className="h-12 w-64 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
