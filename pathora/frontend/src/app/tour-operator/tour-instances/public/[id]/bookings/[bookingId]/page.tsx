import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { featureFlags } from "@/configs/featureFlags";
import BookingAssignmentLandingPage from "@/features/dashboard/components/BookingAssignmentLandingPage";

export const metadata: Metadata = {
  title: "Phân bổ Booking — Tour Public | Tour Operator",
  description: "Chi tiết dịch vụ cần phân bổ cho booking cụ thể trong tour public",
  robots: { index: false, follow: false },
};

export default async function BookingAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; bookingId: string }>;
}) {
  const { id, bookingId } = await params;
  if (!featureFlags.enablePublicTourSubRoutes) {
    redirect(`/tour-operator/tour-instances/${id}`);
  }

  return (
    <BookingAssignmentLandingPage
      instanceId={id}
      bookingId={bookingId}
      backUrl={`/tour-operator/tour-instances/public/${id}`}
    />
  );
}
