export default function CheckoutLoading() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-white border-b border-gray-100" />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* Back link skeleton */}
        <div className="h-4 w-28 rounded bg-gray-200 mb-6" />

        {/* Stepper skeleton */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="size-8 rounded-full bg-gray-200" />
          <div className="h-0.5 w-12 bg-gray-200" />
          <div className="size-8 rounded-full bg-gray-200" />
          <div className="h-0.5 w-12 bg-gray-200" />
          <div className="size-8 rounded-full bg-gray-200" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Booking Summary skeleton */}
            <div className="bg-white rounded-2xl p-5">
              <div className="h-1 w-full bg-gray-200 rounded-t-2xl mb-4" />
              <div className="h-5 w-40 rounded bg-gray-200 mb-4" />
              <div className="flex gap-4 mb-4">
                <div className="size-28 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-36 rounded bg-gray-200" />
                </div>
              </div>
              <div className="h-32 rounded-xl bg-gray-100" />
            </div>
            {/* Terms skeleton */}
            <div className="bg-white rounded-2xl p-5">
              <div className="h-1 w-full bg-gray-200 rounded-t-2xl mb-4" />
              <div className="h-5 w-44 rounded bg-gray-200 mb-4" />
              <div className="h-64 rounded-xl bg-gray-100" />
            </div>
          </div>

          {/* Right column */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5">
              <div className="h-1 w-full bg-gray-200 rounded-t-2xl mb-4" />
              <div className="h-5 w-36 rounded bg-gray-200 mb-4" />
              <div className="h-16 rounded-xl bg-gray-100 mb-3" />
              <div className="h-16 rounded-xl bg-gray-100 mb-5" />
              <div className="h-56 rounded-xl bg-gray-100 mb-5" />
              <div className="h-28 rounded-xl bg-gray-100 mb-5" />
              <div className="h-12 rounded-xl bg-gray-200" />
            </div>
            <div className="bg-white rounded-2xl p-4 h-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
