// Shown instantly while a store page is loading its data.
export default function StoreLoading() {
  return (
    <div className="container-page pt-6" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-48 rounded-md" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="skeleton aspect-[4/5]" />
            <div className="space-y-2 p-3">
              <div className="skeleton h-4 rounded" />
              <div className="skeleton h-5 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
