export default function CustomTourRequestLoading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="h-16 bg-slate-200" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <div className="h-8 w-1/3 rounded bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-200" />
        <div className="h-[560px] rounded-2xl bg-white border border-slate-200" />
      </div>
    </div>
  );
}
