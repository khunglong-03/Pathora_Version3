export default function TourDetailLoading() {
  return (
    <div className="bg-white min-h-screen animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[460px] bg-gray-200" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-64 rounded bg-gray-100 mb-6" />

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left column */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Gallery skeleton */}
            <div className="h-[260px] rounded-2xl bg-gray-100" />
            {/* Info pills skeleton */}
            <div className="h-[70px] rounded-2xl bg-gray-100" />
            {/* Tab content skeleton */}
            <div className="h-[300px] rounded-2xl bg-gray-100" />
          </div>
          {/* Right sidebar skeleton */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
            <div className="h-[800px] rounded-2xl bg-gray-100" />
            <div className="h-[140px] rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
