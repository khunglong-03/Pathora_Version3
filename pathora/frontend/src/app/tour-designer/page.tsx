"use client";

import React from "react";
import { PaintBrush } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/features/dashboard/components";

export default function TourDesignerPage() {
  return (
    <div className="p-6">
      <AdminPageHeader
        title="Tour Designer Portal"
        subtitle="Quản lý thiết kế tour"
      />
      <div className="mt-8 flex flex-col items-center justify-center">
        <div
          className="rounded-2xl p-8 text-center max-w-md"
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}
          >
            <PaintBrush size={32} style={{ color: "#6366F1" }} />
          </div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Chức năng đang được phát triển
          </h2>
          <p
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Portal dành cho Tour Designer. Các tính năng quản lý thiết kế tour sẽ được cập nhật sớm.
          </p>
        </div>
      </div>
    </div>
  );
}