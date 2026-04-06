import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tours",
  openGraph: {
    title: "Tours | Pathora",
    type: "website",
  },
};

export default function ToursLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
