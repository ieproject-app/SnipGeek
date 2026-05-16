export default function CategoryArchiveLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="space-y-4">
        <div className="h-4 w-40 rounded bg-muted/60 skeleton" />
        <div className="h-10 w-3/4 rounded bg-muted/70 skeleton" />
        <div className="h-4 w-11/12 rounded bg-muted/50 skeleton" />
      </header>

      <section className="mt-12 space-y-6">
        <div className="h-6 w-28 rounded bg-muted/60 skeleton" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <article
              key={idx}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm"
            >
              <div className="aspect-8/5 w-full bg-muted/60 skeleton" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-16 rounded bg-muted/50 skeleton" />
                <div className="h-5 w-full rounded bg-muted/70 skeleton" />
                <div className="h-5 w-4/5 rounded bg-muted/70 skeleton" />
                <div className="h-3 w-20 rounded bg-muted/50 skeleton" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
