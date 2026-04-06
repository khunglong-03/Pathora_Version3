export default function ToursLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 bg-slate-200" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
        {/* Toolbar skeleton */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-[180px] rounded-xl skeleton-shimmer" />
            <div className="h-5 w-[100px] rounded skeleton-shimmer" />
          </div>
          <div className="h-10 w-[160px] rounded-xl skeleton-shimmer" />
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] skeleton-shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-1/3 rounded skeleton-shimmer" />
                <div className="h-5 w-3/4 rounded skeleton-shimmer" />
                <div className="h-3 w-1/2 rounded skeleton-shimmer" />
                <div className="h-3 w-2/3 rounded skeleton-shimmer" />
                <div className="h-5 w-1/3 rounded skeleton-shimmer mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
