import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/app/admin/AdminShell";

const TOUROPERATOR_ROLE_NAMES = new Set(["TourOperator"]);

export default async function TourOperatorLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const authStatus = cookieStore.get("auth_status")?.value;
  const authRolesRaw = cookieStore.get("auth_roles")?.value;

  const authenticated = Boolean(authStatus || accessToken || refreshToken);
  let roles: string[] = [];
  if (authRolesRaw) {
    try {
      roles = JSON.parse(decodeURIComponent(authRolesRaw)) as string[];
    } catch {
      roles = [];
    }
  }

  const hasTourOperatorRole = roles.some(
    (role) => role.toLowerCase().replace(/[^a-z0-9]/g, "") === "touroperator",
  );

  if (!authenticated) {
    redirect("/");
  }

  if (!hasTourOperatorRole) {
    redirect("/forbidden");
  }

  return <AdminShell variant="tour-operator" providerPortal="tour-operator">{children}</AdminShell>;
}
