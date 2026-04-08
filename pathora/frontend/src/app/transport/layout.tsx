import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/app/admin/AdminShell";

const TRANSPORTPROVIDER_ROLE_NAMES = new Set(["TransportProvider"]);

export default async function TransportLayout({ children }: { children: ReactNode }) {
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

  const hasProviderRole = roles.some((role) => TRANSPORTPROVIDER_ROLE_NAMES.has(role));

  if (!authenticated || !hasProviderRole) {
    redirect("/home");
  }

  return <AdminShell variant="provider" providerPortal="transport">{children}</AdminShell>;
}
