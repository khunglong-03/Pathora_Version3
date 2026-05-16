import type { Metadata } from "next";
import { RefundTrackingPage } from "@/features/dashboard/components/RefundTrackingPage";

export const metadata: Metadata = {
  title: "Refund Tracking | Pathora",
  description: "Track manual refunds for cancelled bookings in Pathora manager dashboard.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/manager/dashboard/refund-tracking",
  },
};

export default function DashboardRefundTrackingPage() {
  return <RefundTrackingPage />;
}
