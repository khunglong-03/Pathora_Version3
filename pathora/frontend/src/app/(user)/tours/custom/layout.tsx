import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Tour Request | Pathora",
  description:
    "Create your own custom tour itinerary. Tell us your preferences and we'll design a personalized travel experience tailored just for you.",
  keywords: ["custom tour", "personalized travel", "tailor-made tour", "custom itinerary"],
  openGraph: {
    title: "Custom Tour Request | Pathora",
    description:
      "Create your own custom tour itinerary. Tell us your preferences and we'll design a personalized travel experience.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function CustomTourLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
