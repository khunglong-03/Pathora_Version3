"use client";

import SkeletionTable from "@/components/skeleton/Table";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
      <SkeletionTable items={[]} count={6} />
    </div>
  );
}
