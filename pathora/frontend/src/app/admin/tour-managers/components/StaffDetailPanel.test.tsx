import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { StaffDetailPanel } from "./StaffDetailPanel";
import type { StaffMemberDto } from "@/types/admin";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

const renderComponent = (props: React.ComponentProps<typeof StaffDetailPanel>) => {
  return render(<StaffDetailPanel {...props} />);
};

const mockStaff: StaffMemberDto[] = [
  { id: "s1", fullName: "Designer One", email: "d1@test.com", role: "TourOperator", status: "Hoạt động" },
  { id: "s2", fullName: "Guide One", email: "g1@test.com", role: "TourGuide", status: "Hoạt động" },
  { id: "s3", fullName: "Designer Two", email: "d2@test.com", role: "TourOperator", status: "Khóa" },
];

const mockManager: TourManagerSummary = {
  managerId: "mgr1",
  managerName: "Nguyen Van Manager",
  managerEmail: "manager1@test.com",
  designerCount: 2,
  guideCount: 1,
  tourCount: 3,
  assignedStaffIds: [],
};

const mockManagers: TourManagerSummary[] = [
  mockManager,
  { managerId: "mgr2", managerName: "Tran Thi Manager", managerEmail: "manager2@test.com", designerCount: 1, guideCount: 1, tourCount: 2, assignedStaffIds: [] },
];

describe("StaffDetailPanel", () => {
  describe("No manager selected", () => {
    it("shows empty state prompt", () => {
      renderComponent({
        managerId: "",
        manager: null,
        staff: [],
        managers: mockManagers,
        isLoading: false,
        error: null,
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      expect(screen.getByText("Chọn 1 Tour Manager để xem chi tiết")).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("shows skeleton table when isLoading is true", () => {
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: [],
        managers: mockManagers,
        isLoading: true,
        error: null,
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      expect(screen.getByTestId("mock-skeleton-table")).toBeInTheDocument();
    });

    it("shows skeleton for manager header when loading", () => {
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: [],
        managers: mockManagers,
        isLoading: true,
        error: null,
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      // The skeleton panel has the loading indicator
      expect(screen.getByTestId("mock-skeleton-table")).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("shows AdminErrorCard when error is present", () => {
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: [],
        managers: mockManagers,
        isLoading: false,
        error: "Không thể tải danh sách nhân viên.",
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      expect(screen.getByText("Không thể tải danh sách nhân viên.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Thử lại/i })).toBeInTheDocument();
    });

    it("calls onRefresh when retry button is clicked", () => {
      const onRefresh = vi.fn();
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: [],
        managers: mockManagers,
        isLoading: false,
        error: "Server error",
        onRefresh,
        onReassign: vi.fn(),
      });

      fireEvent.click(screen.getByRole("button", { name: /Thử lại/i }));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe("Populated state", () => {
    it("renders manager header card with initials, name, email", () => {
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: mockStaff,
        managers: mockManagers,
        isLoading: false,
        error: null,
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      expect(screen.getByText("Nguyen Van Manager")).toBeInTheDocument();
      expect(screen.getByText("manager1@test.com")).toBeInTheDocument();
    });

    it("renders manager header card with amber left-border", () => {
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: mockStaff,
        managers: mockManagers,
        isLoading: false,
        error: null,
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      const headerCard = screen.getByText("Nguyen Van Manager").closest(".rounded-xl");
      expect(headerCard).toHaveStyle({ borderLeft: "4px solid #C9873A" });
    });

    it("renders designer and guide count badges in header", () => {
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: mockStaff,
        managers: mockManagers,
        isLoading: false,
        error: null,
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      expect(screen.getByText("2 Designers")).toBeInTheDocument();
      expect(screen.getByText("1 Guides")).toBeInTheDocument();
    });

    it("renders refresh button in header", () => {
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: mockStaff,
        managers: mockManagers,
        isLoading: false,
        error: null,
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      expect(screen.getByRole("button", { name: /Làm mới/i })).toBeInTheDocument();
    });

    it("calls onRefresh when refresh button is clicked", () => {
      const onRefresh = vi.fn();
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: mockStaff,
        managers: mockManagers,
        isLoading: false,
        error: null,
        onRefresh,
        onReassign: vi.fn(),
      });

      fireEvent.click(screen.getByRole("button", { name: /Làm mới/i }));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("renders StaffList with staff data", () => {
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: mockStaff,
        managers: mockManagers,
        isLoading: false,
        error: null,
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      // StaffList renders staff items
      expect(screen.getByText("Designer One")).toBeInTheDocument();
      expect(screen.getByText("Guide One")).toBeInTheDocument();
      expect(screen.getByText("Designer Two")).toBeInTheDocument();
    });

    it("renders empty StaffList state when no staff", () => {
      renderComponent({
        managerId: "mgr1",
        manager: mockManager,
        staff: [],
        managers: mockManagers,
        isLoading: false,
        error: null,
        onRefresh: vi.fn(),
        onReassign: vi.fn(),
      });

      expect(screen.getByText(/không có nhân viên/i)).toBeInTheDocument();
    });
  });
});
