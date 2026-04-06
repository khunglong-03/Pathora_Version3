export default function BookingDetailLoading() {
  return (
    <div className="bg-white min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-gray-100" />

      {/* Hero skeleton */}
      <div className="h-[400px] bg-gray-200" />

      {/* Content skeleton */}
      <div className="max-w-[80rem] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="h-[260px] rounded-2xl bg-gray-100" />
            <div className="h-[280px] rounded-2xl bg-gray-100" />
            <div className="h-[540px] rounded-2xl bg-gray-100" />
            <div className="h-[150px] rounded-2xl bg-blue-50" />
          </div>
          {/* Right sidebar */}
          <div className="w-full lg:w-[390px] shrink-0 flex flex-col gap-6">
            <div className="h-[520px] rounded-2xl bg-gray-100" />
            <div className="h-[252px] rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
