import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tours",
  openGraph: {
    title: "Tours | Pathora",
    type: "website",
  },
  alternates: { canonical: "/tours" },
  robots: { index: true, follow: true },
};

export default function ToursLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
