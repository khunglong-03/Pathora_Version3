"use client";

export function SettingsTabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Card skeleton */}
      <div className="bg-white rounded-[2rem] border border-border shadow-card overflow-hidden">
        <div className="px-8 pt-6 pb-4 border-b border-border">
          <div className="h-5 w-32 bg-stone-200 rounded" />
          <div className="h-3 w-20 bg-stone-100 rounded mt-1" />
        </div>
        <div className="px-8 py-6 space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-stone-100 rounded" />
            <div className="h-10 w-full bg-stone-100 rounded-2xl" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-stone-100 rounded" />
            <div className="h-10 w-full bg-stone-100 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-stone-100 rounded" />
              <div className="h-10 w-full bg-stone-100 rounded-2xl" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-stone-100 rounded" />
              <div className="h-10 w-full bg-stone-100 rounded-2xl" />
            </div>
          </div>
        </div>
        <div className="px-8 pb-6 pt-4 border-t border-border">
          <div className="h-9 w-28 bg-stone-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
