export default function BookingsLoading() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-white border-b border-gray-100" />

      {/* Hero skeleton */}
      <div className="bg-[#05073c] pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="h-4 w-32 rounded bg-white/10 mb-6" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="h-9 w-48 rounded bg-white/10 mb-2" />
              <div className="h-4 w-80 rounded bg-white/10" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-16 rounded-xl bg-white/10" />
              <div className="w-20 h-16 rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Search & filter skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-10 w-full md:max-w-md rounded-xl bg-gray-100" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-5 w-12 rounded bg-gray-100" />
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-7 w-20 rounded-full bg-gray-100" />
              ))}
            </div>
          </div>
        </div>

        {/* Booking card skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="flex flex-col md:flex-row">
              {/* Image placeholder */}
              <div className="w-full md:w-64 h-48 md:h-72 bg-gray-200 shrink-0" />

              {/* Content */}
              <div className="flex-1 p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-52 rounded bg-gray-200" />
                      <div className="h-6 w-16 rounded-full bg-gray-100" />
                    </div>
                    <div className="h-3.5 w-32 rounded bg-gray-100" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-14 rounded bg-gray-200 mb-1" />
                    <div className="h-3 w-12 rounded bg-gray-100" />
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-start gap-2">
                      <div className="size-4 rounded bg-gray-200" />
                      <div>
                        <div className="h-3 w-12 rounded bg-gray-100 mb-1" />
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="h-9 w-32 rounded-lg bg-gray-100" />
                  <div className="h-9 w-24 rounded-lg bg-gray-100" />
                </div>

                {/* Footer */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-5 pt-4 border-t border-gray-100">
                  <div>
                    <div className="h-3 w-20 rounded bg-gray-100 mb-1" />
                    <div className="h-8 w-24 rounded bg-gray-200" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-20 rounded-lg bg-gray-100" />
                    <div className="h-9 w-28 rounded-lg bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
