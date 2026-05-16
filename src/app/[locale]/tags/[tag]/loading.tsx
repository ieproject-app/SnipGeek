export default function TagLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <header className="mb-16 text-center">
        <div className="skeleton mx-auto mb-4 h-10 w-56 rounded-lg" data-variant="pulse" />
        <div className="skeleton mx-auto h-5 w-full max-w-lg rounded-md" data-variant="pulse" />
      </header>
      <section className="space-y-16">
        <div>
          <div className="mb-8 flex items-center gap-4">
            <div className="skeleton h-8 w-24 rounded-md" data-variant="pulse" />
            <div className="skeleton h-0.5 flex-1 rounded-full" data-variant="static" />
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="space-y-4">
                <div className="skeleton aspect-8/5 w-full rounded-xl" data-variant="shimmer" />
                <div className="skeleton h-4 w-20 rounded-md" data-variant="pulse" />
                <div className="skeleton h-5 w-full rounded-md" data-variant="pulse" />
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
