export default function CategoryIndexLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <section className="space-y-4">
        <div className="h-4 w-36 rounded bg-muted/60 skeleton" />
        <div className="h-10 w-2/3 rounded bg-muted/70 skeleton" />
        <div className="h-4 w-11/12 rounded bg-muted/50 skeleton" />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, idx) => (
          <article
            key={idx}
            className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-muted/60 skeleton" />
              <div className="h-5 w-2/3 rounded bg-muted/70 skeleton" />
              <div className="h-3 w-24 rounded bg-muted/50 skeleton" />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
