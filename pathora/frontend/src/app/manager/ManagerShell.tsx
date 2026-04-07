"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/features/dashboard/components/AdminSidebar";

interface ManagerShellProps {
  children: ReactNode;
}

export default function ManagerShell({ children }: ManagerShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminSidebar
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      variant="manager"
    >
      {children}
    </AdminSidebar>
  );
}
