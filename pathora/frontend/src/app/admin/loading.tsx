"use client";

import Grid from "@/components/skeleton/Grid";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
      <Grid items={[]} count={6} />
    </div>
  );
}
