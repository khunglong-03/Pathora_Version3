import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | Pathora",
  description:
    "Manage your Pathora profile. Update personal information, change password, and configure notification preferences.",
  openGraph: {
    title: "My Profile | Pathora",
    description:
      "Manage your Pathora profile. Update personal information and configure notification preferences.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
