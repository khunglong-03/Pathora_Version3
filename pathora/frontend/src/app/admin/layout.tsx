import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "./AdminShell";

const ADMIN_ROLE_NAMES = new Set(["Admin"]);

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const authStatus = cookieStore.get("auth_status")?.value;
  const authRolesRaw = cookieStore.get("auth_roles")?.value;

  const authenticated = Boolean(authStatus);
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
    redirect("/home");
  }

  return <AdminShell>{children}</AdminShell>;
}
