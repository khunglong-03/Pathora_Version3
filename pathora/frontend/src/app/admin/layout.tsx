import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "./AdminShell";

const ADMIN_ROLE_NAMES = new Set(["Admin"]);

export default async function AdminLayout({ children }: { children: ReactNode }) {
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

  const hasAdminRole = roles.some((role) => ADMIN_ROLE_NAMES.has(role));

  if (!authenticated || !hasAdminRole) {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
