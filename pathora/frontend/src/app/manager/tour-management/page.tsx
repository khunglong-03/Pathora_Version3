import type { Metadata } from "next";
import { Suspense } from "react";
import { TourListPage } from "@/features/dashboard/components/TourListPage";
import { SkeletonTable } from "@/components/ui/SkeletonTable";

export const metadata: Metadata = {
  title: "Tour Management | Pathora",
  description: "Manage tours, create new tours, and update tour information in Pathora admin.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TourManagementPage() {
  return (
    <Suspense fallback={<div className="p-6"><SkeletonTable rows={4} columns={5} /></div>}>
      <TourListPage />
    </Suspense>
  );
}
