import type { Metadata } from "next";
import { TourDesignerTourListPage } from "@/features/tour-designer/components/TourDesignerTourListPage";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "My Tours | Tour Designer",
};

export default function MyToursPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <SkeletonTable rows={4} columns={4} />
        </div>
      }
    >
      <TourDesignerTourListPage />
    </Suspense>
  );
}