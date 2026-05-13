import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { featureFlags } from "@/configs/featureFlags";
import BookingAccommodationAssignmentPage from "@/features/dashboard/components/BookingAccommodationAssignmentPage";

export const metadata: Metadata = {
  title: "Gán Khách Sạn Booking — Tour Public | Tour Operator",
  description: "Gán khách sạn cho 1 booking cụ thể trong tour public",
  robots: { index: false, follow: false },
};

export default async function BookingAssignAccommodationPage({
  params,
}: {
  params: Promise<{ id: string; bookingId: string }>;
}) {
  const { id, bookingId } = await params;
  if (!featureFlags.enablePublicTourSubRoutes) {
    redirect(`/tour-operator/tour-instances/${id}`);
  }

  return (
    <BookingAccommodationAssignmentPage
      instanceId={id}
      bookingId={bookingId}
      backUrl={`/tour-operator/tour-instances/public/${id}`}
    />
  );
}
