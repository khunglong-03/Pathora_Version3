import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookings",
  openGraph: {
    title: "My Bookings | Pathora",
    type: "website",
  },
  alternates: { canonical: "/bookings" },
  robots: { index: true, follow: true },
};

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
