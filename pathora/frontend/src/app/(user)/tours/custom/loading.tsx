export default function CustomTourLoading() {
  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen animate-pulse">
      <div className="h-16 bg-gray-100 dark:bg-slate-800" />
      {/* Hero */}
      <div className="h-[500px] bg-gray-200 dark:bg-slate-700" />
      {/* Form */}
      <div className="max-w-[53rem] mx-auto px-6 py-12 space-y-8">
        <div className="h-[360px] rounded-2xl bg-gray-100 dark:bg-slate-800" />
        <div className="h-[580px] rounded-2xl bg-gray-100 dark:bg-slate-800" />
        <div className="h-[280px] rounded-2xl bg-gray-100 dark:bg-slate-800" />
        <div className="h-[270px] rounded-2xl bg-gray-100 dark:bg-slate-800" />
        <div className="h-[170px] rounded-2xl bg-blue-50 dark:bg-slate-800" />
        <div className="h-14 rounded-[14px] bg-orange-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
