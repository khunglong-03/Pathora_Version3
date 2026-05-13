import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { featureFlags } from "@/configs/featureFlags";
import BookingAccommodationAssignmentPage from "@/features/dashboard/components/BookingAccommodationAssignmentPage";

export const metadata: Metadata = {
  title: "Gán Khách Sạn — Tour Public | Tour Operator",
  description: "Phân bổ phòng khách sạn cho từng booking trong tour public",
  robots: { index: false, follow: false },
};

export default async function PublicBookAccommodationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!featureFlags.enablePublicTourSubRoutes) {
    redirect(`/tour-operator/tour-instances/${id}`);
  }

  return (
    <BookingAccommodationAssignmentPage
      instanceId={id}
      backUrl={`/tour-operator/tour-instances/public/${id}`}
    />
  );
}
