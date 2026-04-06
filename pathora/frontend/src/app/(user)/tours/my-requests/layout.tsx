import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Tour Requests | Pathora",
  description:
    "View and manage your custom tour requests with Pathora. Track the status of your inquiries and receive personalized travel offers.",
  openGraph: {
    title: "My Tour Requests | Pathora",
    description:
      "View and manage your custom tour requests. Track the status of your inquiries and receive personalized travel offers.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function MyRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
