import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tour Request Details | Pathora",
  description:
    "View the details of your custom tour request. Track the status and get personalized offers from Pathora.",
  openGraph: {
    title: "Tour Request Details | Pathora",
    description:
      "View the details of your custom tour request. Track the status and get personalized offers.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function TourRequestDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
