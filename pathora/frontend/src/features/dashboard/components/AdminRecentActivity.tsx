"use client";

import React from "react";
import Link from "next/link";
import type { ActivityItem } from "@/types/admin";
import { Clock } from "@phosphor-icons/react";

function formatRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return timestamp;
  }
}

const ACTIVITY_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  booking: { bg: "#DBEAFE", text: "#2563EB", icon: "Ticket" },
  user: { bg: "#FEF3C7", text: "#C9873A", icon: "Users" },
  tour: { bg: "#EDE9FE", text: "#7C3AED", icon: "GlobeHemisphereWest" },
  payment: { bg: "#DCFCE7", text: "#16A34A", icon: "CreditCard" },
  default: { bg: "#F3F4F6", text: "#6B7280", icon: "Activity" },
};

interface AdminRecentActivityProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export function AdminRecentActivity({ activities = [], maxItems = 10 }: AdminRecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (!activities?.length) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: "#9CA3AF" }}>
        Chưa có hoạt động nào.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity, index) => {
        const typeStyle = ACTIVITY_TYPE_COLORS[activity.type ?? ""] ?? ACTIVITY_TYPE_COLORS["default"];

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 py-2"
            style={{
              animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
            }}
          >
            {/* Timeline dot */}
            <div className="relative mt-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: typeStyle.text }}
              />
              {index < displayActivities.length - 1 && (
                <div
                  className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-6"
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold" style={{ color: typeStyle.text }}>
                  {activity.actor}
                </span>
                <span className="text-sm" style={{ color: "#374151" }}>
                  {activity.action}
                </span>
                {activity.target && (
                  <span className="text-sm font-medium" style={{ color: "#111827" }}>
                    {activity.target}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock size={11} style={{ color: "#9CA3AF" }} />
                <span className="text-xs" style={{ color: "#9CA3AF" }}>
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {activities.length > maxItems && (
        <div className="pt-2 text-center">
          <Link
            href="/admin/activity"
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: "#C9873A" }}
          >
            Xem tất cả hoạt động
          </Link>
        </div>
      )}
    </div>
  );
}
