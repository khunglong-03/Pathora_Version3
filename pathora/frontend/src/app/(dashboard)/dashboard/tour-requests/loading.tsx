export default function DashboardTourRequestsLoading() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`tour-request-filter-skeleton-${index}`}
              className="h-10 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`tour-request-table-skeleton-${index}`}
              className="h-9 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
