// Shown instantly while a store page is loading its data.
export default function StoreLoading() {
  return (
    <div className="container-page animate-pulse pt-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded-md bg-zinc-200" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="aspect-[4/5] bg-zinc-200" />
            <div className="space-y-2 p-3">
              <div className="h-4 rounded bg-zinc-200" />
              <div className="h-5 w-1/2 rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
