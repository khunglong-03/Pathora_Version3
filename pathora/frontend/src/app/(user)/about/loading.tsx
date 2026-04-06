export default function AboutLoading() {
  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen animate-pulse">
      <div className="h-16 bg-gray-100 dark:bg-slate-800" />
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-8">
        <div className="h-10 w-1/3 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-slate-800" />
        <div className="h-48 rounded-xl bg-gray-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}
