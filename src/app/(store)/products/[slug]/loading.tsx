// Shown the moment a product card is tapped, while the product page loads.
// Same shape as the real page (photo left, details right), so nothing jumps.
export default function ProductLoading() {
  return (
    <div className="container-page pt-6" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-4 w-40 rounded" />
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <div className="skeleton aspect-[4/5] rounded-2xl" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="skeleton size-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="skeleton h-8 w-4/5 rounded-md" />
          <div className="skeleton h-7 w-1/3 rounded-md" />
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="skeleton h-10 w-14 rounded-lg" />
            ))}
          </div>
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
