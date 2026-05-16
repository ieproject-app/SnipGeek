export default function BlogLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 lg:px-8">
      <header className="mb-12 text-center">
        <div className="skeleton mx-auto mb-4 h-10 w-40 rounded-lg" data-variant="pulse" />
        <div className="skeleton mx-auto h-5 w-full max-w-xl rounded-md" data-variant="pulse" />
      </header>
      <section className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <article key={index} className="space-y-4">
            <div className="skeleton aspect-8/5 w-full rounded-xl" data-variant="shimmer" />
            <div className="skeleton h-4 w-20 rounded-md" data-variant="pulse" />
            <div className="skeleton h-5 w-full rounded-md" data-variant="pulse" />
            <div className="skeleton h-3 w-24 rounded-md" data-variant="pulse" />
          </article>
        ))}
      </section>
    </main>
  );
}
