export default function HomeLoading() {
  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-gray-100 dark:bg-slate-800" />

      {/* Hero skeleton */}
      <div className="h-[500px] bg-gray-200 dark:bg-slate-700" />

      {/* Content sections skeleton */}
      <div className="flex flex-col gap-16 py-16 max-w-7xl mx-auto px-4">
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-slate-800" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}
