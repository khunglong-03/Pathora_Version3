import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Status | Pathora",
  description:
    "View your payment status and transaction details with Pathora.",
  openGraph: {
    title: "Payment Status | Pathora",
    description: "View your Pathora payment status and transaction details.",
    type: "website",
  },
  twitter: { card: "summary" },
  alternates: { canonical: "/payment" },
  robots: { index: true, follow: true },
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
