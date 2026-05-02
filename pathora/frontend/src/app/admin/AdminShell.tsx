"use client";

import React, { useEffect, useState } from "react";
import { AdminSidebar, TopBar } from "@/features/dashboard/components/AdminSidebar";

interface AdminShellProps {
  children: React.ReactNode;
  variant?: "admin" | "manager" | "provider" | "tour-operator" | "tour-guide";
  providerPortal?: "hotel" | "transport" | "tour-operator" | "tour-guide";
}

const ADMIN_ROLE_NAME = "Admin";

const parseAuthRoles = (cookieValue: string | undefined): string[] => {
  if (!cookieValue) return [];
  try {
    return JSON.parse(decodeURIComponent(cookieValue)) as string[];
  } catch {
    return [];
  }
};

export default function AdminShell({
  children,
  variant = "admin",
  providerPortal,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const authRolesRaw = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("auth_roles="))
      ?.slice("auth_roles=".length);

    const roles = parseAuthRoles(authRolesRaw);
    setIsAdmin(roles.includes(ADMIN_ROLE_NAME));
  }, []);

  return (
    <AdminSidebar
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      variant={variant}
      isAdmin={isAdmin}
      providerPortal={providerPortal}
    >
      <div className="flex flex-col min-h-screen bg-slate-100 relative">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 w-full mx-auto">
          {children}
        </div>
      </div>
    </AdminSidebar>
  );
}
