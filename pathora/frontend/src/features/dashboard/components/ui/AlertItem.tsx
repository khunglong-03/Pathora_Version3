"use client";

import { Icon } from "@/components/ui";
import { AdminDashboardAlert } from "@/types/admin";

interface AlertItemProps {
  alert: AdminDashboardAlert;
}

const SEVERITY_STYLES: Record<string, { icon: string; textColor: string; bgColor: string; borderColor: string }> = {
  info:    { icon: "heroicons:information-circle",   textColor: "#3B82F6", bgColor: "#DBEAFE",    borderColor: "#BFDBFE" },
  warning: { icon: "heroicons:exclamation-triangle", textColor: "#F59E0B", bgColor: "#FEF3C7",   borderColor: "#FDE68A" },
  danger:  { icon: "heroicons:exclamation-circle",   textColor: "#EF4444", bgColor: "#FEE2E2",    borderColor: "#FECACA" },
  success: { icon: "heroicons:check-circle",         textColor: "#10B981", bgColor: "#D1FAE5",    borderColor: "#A7F3D0" },
};

export function AlertItem({ alert }: AlertItemProps) {
  const s = SEVERITY_STYLES[alert.severity.toLowerCase()] ?? SEVERITY_STYLES["info"];

  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-xl border"
      style={{ backgroundColor: s.bgColor, borderColor: s.borderColor }}
    >
      <Icon icon={s.icon} className="size-4 shrink-0" style={{ color: s.textColor }} />
      <p className="text-sm" style={{ color: s.textColor }}>
        {alert.text}
      </p>
    </div>
  );
}
