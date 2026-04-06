"use client";

import type { TeamRole } from "../types";

const ROLE_STYLES: Record<TeamRole, { bg: string; text: string }> = {
  Owner: { bg: "bg-amber-50", text: "text-amber-700" },
  Admin: { bg: "bg-blue-50", text: "text-blue-700" },
  Editor: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Viewer: { bg: "bg-stone-100", text: "text-stone-600" },
};

interface RoleBadgeProps {
  role: TeamRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.Viewer;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {role}
    </span>
  );
}
