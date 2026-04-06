export default function VisaLoading() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-white border-b border-gray-100" />

      {/* Hero skeleton */}
      <div className="bg-[#05073c] pt-24 pb-16 md:pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-4 w-40 rounded bg-white/10 mb-6" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-white/10" />
              <div>
                <div className="h-8 w-48 rounded bg-white/10 mb-2" />
                <div className="h-3.5 w-72 rounded bg-white/10" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-[76px] h-[60px] rounded-xl bg-white/10" />
              <div className="w-[76px] h-[60px] rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6">
        {/* Search & filter skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-10 w-full md:max-w-md rounded-xl bg-gray-100" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-5 w-12 rounded bg-gray-100" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-20 rounded-full bg-gray-100" />
              ))}
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex flex-col lg:flex-row gap-8 pb-10">
          {/* Left column */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Participants card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-[#05073c] h-15 flex items-center px-6">
                <div className="h-5 w-32 rounded bg-white/10" />
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="px-5 py-5 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="size-12 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                        <div className="h-5 w-12 rounded-full bg-gray-100" />
                      </div>
                      <div className="h-3 w-20 rounded bg-gray-100" />
                      <div className="h-6 w-24 rounded-full bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="size-5 rounded-full bg-blue-200 shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-48 rounded bg-blue-200 mb-3" />
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-3 w-full rounded bg-blue-100" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[198px] flex flex-col items-center justify-center">
              <div className="size-16 rounded-full bg-gray-100 mb-3" />
              <div className="h-4 w-52 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
