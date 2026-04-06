import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Pathora is a premier travel platform offering curated tour packages, custom tour planning, visa assistance, and comprehensive travel services across Vietnam and Asia.",
  openGraph: {
    title: "Home | Pathora",
    description:
      "Pathora is a premier travel platform offering curated tour packages, custom tour planning, visa assistance, and comprehensive travel services.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootPage() {
  redirect("/home");
}
