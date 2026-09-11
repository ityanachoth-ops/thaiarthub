export default function EventDetailLoading() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-muted" />
        <div className="space-y-3">
          <div className="h-9 w-2/3 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </main>
  );
}