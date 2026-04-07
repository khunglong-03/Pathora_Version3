"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "@/features/dashboard/components/AdminSidebar";

interface AdminShellProps {
  children: React.ReactNode;
  variant?: "admin" | "manager" | "provider";
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
  variant = "manager",
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
    >
      <div style={{ backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
        {children}
      </div>
    </AdminSidebar>
  );
}
