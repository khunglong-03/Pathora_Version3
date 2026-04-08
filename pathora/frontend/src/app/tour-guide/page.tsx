"use client";

import React from "react";
import { MapTrifold } from "@phosphor-icons/react";
import { AdminPageHeader } from "@/features/dashboard/components";

export default function TourGuidePage() {
  return (
    <div className="p-6">
      <AdminPageHeader
        title="Tour Guide Portal"
        subtitle="Quản lý hướng dẫn viên"
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
            style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
          >
            <MapTrifold size={32} style={{ color: "#22C55E" }} />
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
            Portal dành cho Tour Guide. Các tính năng quản lý hướng dẫn viên sẽ được cập nhật sớm.
          </p>
        </div>
      </div>
    </div>
  );
}