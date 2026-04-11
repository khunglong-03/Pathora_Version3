"use client";

import React, { useState } from "react";
import { AdminSidebar } from "@/features/dashboard/components/AdminSidebar";

interface AdminShellProps {
  children: React.ReactNode;
  variant?: "admin" | "manager" | "provider" | "tour-designer" | "tour-guide";
  providerPortal?: "hotel" | "transport" | "tour-designer" | "tour-guide";
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

const getIsAdmin = (): boolean => {
  const authRolesRaw = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("auth_roles="))
    ?.slice("auth_roles=".length);

  const roles = parseAuthRoles(authRolesRaw);
  return roles.includes(ADMIN_ROLE_NAME);
};

export default function AdminShell({
  children,
  variant = "admin",
  providerPortal,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = getIsAdmin();

  return (
    <AdminSidebar
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      variant={variant}
      isAdmin={isAdmin}
      providerPortal={providerPortal}
    >
      <div style={{ backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
        {children}
      </div>
    </AdminSidebar>
  );
}
