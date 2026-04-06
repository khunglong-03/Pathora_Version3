import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import AdminDashboardPage from "@/app/admin/dashboard/page";

vi.mock("@/api/services/adminService", () => {
  return {
    adminService: {
      getDashboardOverview: vi.fn(),
    },
  };
});

import { adminService } from "@/api/services/adminService";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: Record<string, unknown>) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockOverview = {
  totalUsers: 42,
  activeUsers: 38,
  totalManagers: 5,
  totalTourDesigners: 10,
  totalTourGuides: 15,
  totalTransportProviders: 8,
  activeTransportProviders: 6,
  transportBookingCount: 120,
  totalHotelProviders: 4,
  activeHotelProviders: 3,
  hotelRoomCount: 340,
  recentActivities: [
    {
      id: "1",
      actor: "Nguyễn Văn Admin",
      action: "đã phê duyệt",
      target: "Tour Hà Nội - Sapa",
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      type: "booking",
    },
    {
      id: "2",
      actor: "Trần Thị Manager",
      action: "đã thêm",
      target: "nhân viên mới",
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      type: "user",
    },
    {
      id: "3",
      actor: "Lê Văn Designer",
      action: "đã tạo",
      target: "Lịch trình Hạ Long",
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      type: "tour",
    },
  ],
};

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton while fetching overview", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(adminService.getDashboardOverview).mockReturnValue(promise as never);

    render(<AdminDashboardPage />);
    const skeleton = document.querySelector(".skeleton");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders KPIs with correct values after load", async () => {
    vi.mocked(adminService.getDashboardOverview).mockResolvedValue(mockOverview);

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });
    expect(screen.getByText("Tổng người dùng")).toBeInTheDocument();
    expect(screen.getByText("Quản lý")).toBeInTheDocument();
  });

  it("renders recent activities section with heading", async () => {
    vi.mocked(adminService.getDashboardOverview).mockResolvedValue(mockOverview);

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Hoạt động gần đây")).toBeInTheDocument();
    });
  });

  it("shows 'Chưa có hoạt động nào' when no activities", async () => {
    vi.mocked(adminService.getDashboardOverview).mockResolvedValue({
      ...mockOverview,
      recentActivities: [],
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Chưa có hoạt động nào.")).toBeInTheDocument();
    });
  });

  it("renders error card on API failure", async () => {
    vi.mocked(adminService.getDashboardOverview).mockResolvedValue(null);

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-error-card")).toBeInTheDocument();
    });
  });

  it("renders 'Xem tất cả hoạt động' link", async () => {
    const manyActivities = Array.from({ length: 12 }, (_, i) => ({
      id: String(i + 1),
      actor: `User ${i + 1}`,
      action: "đã thực hiện",
      target: `Hành động ${i + 1}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      type: "booking",
    }));
    vi.mocked(adminService.getDashboardOverview).mockResolvedValue({
      ...mockOverview,
      recentActivities: manyActivities,
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      const link = screen.getByRole("link", { name: /xem tất cả hoạt động/i });
      expect(link).toHaveAttribute("href", "/admin/activity");
    });
  });
});
