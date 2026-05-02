import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/app/admin/AdminShell";

const TOURGUIDE_ROLE_NAMES = new Set(["TourGuide"]);

export default async function TourGuideLayout({ children }: { children: ReactNode }) {
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

  const hasTourGuideRole = roles.some((role) => TOURGUIDE_ROLE_NAMES.has(role));

  if (!authenticated || !hasTourGuideRole) {
    redirect("/");
  }

  return <AdminShell variant="tour-guide" providerPortal="tour-guide">{children}</AdminShell>;
}
