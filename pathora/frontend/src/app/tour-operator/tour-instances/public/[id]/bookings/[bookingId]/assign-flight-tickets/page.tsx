import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { featureFlags } from "@/configs/featureFlags";
import { TourOperatorBookTransport } from "@/features/tour-operator/components/TourOperatorBookTransport";

export const metadata: Metadata = {
  title: "Gán Vé Booking — Tour Public | Tour Operator",
  description: "Gán vé máy bay / tàu / thuyền cho 1 booking cụ thể trong tour public",
  robots: { index: false, follow: false },
};

export default async function BookingAssignFlightTicketsPage({
  params,
}: {
  params: Promise<{ id: string; bookingId: string }>;
}) {
  const { id, bookingId } = await params;
  if (!featureFlags.enablePublicTourSubRoutes) {
    redirect(`/tour-operator/tour-instances/${id}`);
  }

  return (
    <TourOperatorBookTransport
      instanceId={id}
      scopedBookingId={bookingId}
      backUrl={`/tour-operator/tour-instances/public/${id}/bookings/${bookingId}`}
    />
  );
}
