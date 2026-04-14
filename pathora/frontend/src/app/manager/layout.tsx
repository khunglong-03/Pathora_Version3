import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import ManagerShell from "./ManagerShell";

const MANAGER_ROLE_NAMES = new Set(["Manager", "Admin"]);

export default async function DashboardRouteGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
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

  const hasManagerRole = roles.some((role) => MANAGER_ROLE_NAMES.has(role));

  if (!authenticated || !hasManagerRole) {
    redirect("/");
  }

  return (
    <ManagerShell>{children}</ManagerShell>
  );
}
