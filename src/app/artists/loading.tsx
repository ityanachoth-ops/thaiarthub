export default function ArtistsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-32 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-stone-100" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/3] w-full animate-pulse rounded-2xl border border-stone-200 bg-stone-100"
          />
        ))}
      </div>
    </div>
  );
}
