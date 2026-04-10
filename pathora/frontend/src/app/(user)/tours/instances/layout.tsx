import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tour Instances",
  openGraph: {
    title: "Tour Instances | Pathora",
    type: "website",
  },
  alternates: { canonical: "/tours/instances" },
  robots: { index: true, follow: true },
};

export default function TourInstancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
