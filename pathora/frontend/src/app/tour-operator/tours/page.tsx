import type { Metadata } from "next";
import { TourOperatorTourListPage } from "@/features/tour-operator/components/TourOperatorTourListPage";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "My Tours | Tour Operator",
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
      <TourOperatorTourListPage />
    </Suspense>
  );
}