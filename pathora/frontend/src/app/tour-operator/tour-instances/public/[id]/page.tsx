import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { featureFlags } from "@/configs/featureFlags";
import TourInstanceDetailPage from "@/features/dashboard/components/TourInstanceDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết Tour Public | Tour Operator",
  description: "Xem lịch trình và gán dịch vụ cho tour public",
  robots: { index: false, follow: false },
};

export default async function TourOperatorPublicTourDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!featureFlags.enablePublicTourSubRoutes) {
    redirect(`/tour-operator/tour-instances/${id}`);
  }

  return <TourInstanceDetailPage variant="public" />;
}
