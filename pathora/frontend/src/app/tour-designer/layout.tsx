import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/app/admin/AdminShell";

const TOURDESIGNER_ROLE_NAMES = new Set(["TourDesigner"]);

export default async function TourDesignerLayout({ children }: { children: ReactNode }) {
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

  const hasTourDesignerRole = roles.some((role) => TOURDESIGNER_ROLE_NAMES.has(role));

  if (!authenticated || !hasTourDesignerRole) {
    redirect("/");
  }

  return <AdminShell variant="tour-designer" providerPortal="tour-designer">{children}</AdminShell>;
}