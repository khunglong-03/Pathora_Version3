import dynamic from "next/dynamic";

const BookingsPage = dynamic(
  () => import("@/features/dashboard/components/BookingsPage"),
);

export default function DashboardBookingsPage() {
  return <BookingsPage />;
}
