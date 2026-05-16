export default function BlogPostLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 lg:px-8">
      <article>
        <header className="mb-12 text-center">
          <div className="skeleton mx-auto mb-6 h-4 w-64 rounded-md" data-variant="pulse" />
          <div className="skeleton mx-auto mb-4 h-12 w-full max-w-3xl rounded-xl" data-variant="pulse" />
          <div className="skeleton mx-auto h-5 w-72 rounded-md" data-variant="pulse" />
        </header>
        <div className="skeleton mb-12 aspect-[16/10] w-full rounded-xl" data-variant="shimmer" />
        <div className="mx-auto max-w-3xl space-y-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="skeleton h-4 rounded-md"
              data-variant="pulse"
              style={{ width: `${index % 3 === 0 ? 72 : index % 3 === 1 ? 96 : 84}%` }}
            />
          ))}
        </div>
      </article>
    </main>
  );
}
