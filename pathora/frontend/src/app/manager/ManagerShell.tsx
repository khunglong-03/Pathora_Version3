"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AdminSidebar, TopBar } from "@/features/dashboard/components/AdminSidebar";

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
      <div className="flex flex-col min-h-screen bg-slate-100 relative">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 w-full mx-auto">
          {children}
        </div>
      </div>
    </AdminSidebar>
  );
}
