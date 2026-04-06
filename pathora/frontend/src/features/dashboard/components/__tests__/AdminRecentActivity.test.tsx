import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { AdminRecentActivity } from "../AdminRecentActivity";
import type { ActivityItem } from "@/types/admin";

const renderComponent = (props: React.ComponentProps<typeof AdminRecentActivity>) => {
  return render(<AdminRecentActivity {...props} />);
};

describe("AdminRecentActivity", () => {
  it("renders activity items with actor, action, and target", () => {
    const activities: ActivityItem[] = [
      {
        id: "act1",
        actor: "Nguyễn Văn Admin",
        action: "đã phê duyệt",
        target: "Tour Hà Nội - Sapa",
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        type: "booking",
      },
    ];
    renderComponent({ activities });

    expect(screen.getByText("Nguyễn Văn Admin")).toBeInTheDocument();
    expect(screen.getByText("đã phê duyệt")).toBeInTheDocument();
    expect(screen.getByText("Tour Hà Nội - Sapa")).toBeInTheDocument();
  });

  it("renders timestamps in relative format", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T12:00:00.000Z"));

    const activities: ActivityItem[] = [
      { id: "act1", actor: "Admin", action: "phê duyệt", target: "Tour", timestamp: new Date("2026-04-05T11:50:00.000Z").toISOString(), type: "booking" },
    ];
    renderComponent({ activities });

    expect(screen.getByText(/phút trước/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("renders empty state when no activities", () => {
    renderComponent({ activities: [] });

    expect(screen.getByText("Chưa có hoạt động nào.")).toBeInTheDocument();
  });

  it("shows 'Xem tất cả hoạt động' link when maxItems < total", () => {
    const activities: ActivityItem[] = [
      { id: "act1", actor: "Admin", action: "phê duyệt", target: "Tour", timestamp: new Date().toISOString(), type: "booking" },
      { id: "act2", actor: "Manager", action: "thêm", target: "user", timestamp: new Date().toISOString(), type: "user" },
    ];
    renderComponent({ activities, maxItems: 1 });

    expect(screen.getByRole("link", { name: /xem tất cả hoạt động/i })).toHaveAttribute("href", "/admin/activity");
  });

  it("does not show 'Xem tất cả' link when all items are shown", () => {
    const activities: ActivityItem[] = [
      { id: "act1", actor: "Admin", action: "phê duyệt", target: "Tour", timestamp: new Date().toISOString(), type: "booking" },
    ];
    renderComponent({ activities, maxItems: 10 });

    const link = screen.queryByRole("link", { name: /xem tất cả hoạt động/i });
    expect(link).toBeNull();
  });

  it("renders activity without target field", () => {
    const noTargetActivity: ActivityItem[] = [
      {
        id: "act3",
        actor: "System",
        action: "đã cập nhật",
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        type: "payment",
      },
    ];
    renderComponent({ activities: noTargetActivity });

    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("đã cập nhật")).toBeInTheDocument();
  });
});
