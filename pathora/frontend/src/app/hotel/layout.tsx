"use client";

import AdminShell from "@/app/admin/AdminShell";

export default function HotelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell variant="provider">{children}</AdminShell>;
}
