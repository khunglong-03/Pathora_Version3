import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { featureFlags } from "@/configs/featureFlags";
import FlightTicketAssignmentPage from "@/features/dashboard/components/FlightTicketAssignmentPage";

export const metadata: Metadata = {
  title: "Gán Vé Phương Tiện — Tour Public | Tour Operator",
  description: "Gán vé máy bay / tàu / thuyền per-booking cho tour public",
  robots: { index: false, follow: false },
};

export default async function PublicAssignFlightTicketsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!featureFlags.enablePublicTourSubRoutes) {
    redirect(`/tour-operator/tour-instances/${id}`);
  }

  return (
    <FlightTicketAssignmentPage
      instanceId={id}
      backUrl={`/tour-operator/tour-instances/public/${id}`}
    />
  );
}
