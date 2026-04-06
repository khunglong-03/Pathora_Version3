import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Details | Pathora",
  description:
    "View your Pathora booking details. Track your tour booking status, view itinerary, and manage your reservation.",
  openGraph: {
    title: "Booking Details | Pathora",
    description: "View your Pathora booking details and track your reservation.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function BookingDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
