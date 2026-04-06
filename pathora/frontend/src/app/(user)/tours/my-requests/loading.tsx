export default function MyRequestsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="h-16 bg-slate-200" />
      <div className="h-56 bg-slate-300" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`my-request-loading-${index}`}
            className="h-36 rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
