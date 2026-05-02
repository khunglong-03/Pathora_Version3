import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/app/admin/AdminShell";

const HOTELSERVICEPROVIDER_ROLE_NAMES = new Set(["HotelServiceProvider"]);

export default async function HotelLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const authRolesRaw = cookieStore.get("auth_roles")?.value;

  const authenticated = Boolean(accessToken || refreshToken);
  let roles: string[] = [];
  if (authRolesRaw) {
    try {
      roles = JSON.parse(decodeURIComponent(authRolesRaw)) as string[];
    } catch {
      roles = [];
    }
  }

  const hasProviderRole = roles.some((role) => HOTELSERVICEPROVIDER_ROLE_NAMES.has(role));

  if (!authenticated || !hasProviderRole) {
    redirect("/");
  }

  return <AdminShell variant="provider" providerPortal="hotel">{children}</AdminShell>;
}
