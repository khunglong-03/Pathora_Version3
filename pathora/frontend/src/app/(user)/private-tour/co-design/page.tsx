import { Suspense } from "react";
import { CoDesignPage } from "@/features/private-co-design/CoDesignPage";

export default function PrivateTourCoDesignRoute() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] animate-pulse rounded-2xl bg-slate-100 mx-auto max-w-3xl mt-10" />}>
      <CoDesignPage />
    </Suspense>
  );
}
