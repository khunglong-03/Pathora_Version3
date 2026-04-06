import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { ManagerListPanel } from "./ManagerListPanel";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

const renderComponent = (props: React.ComponentProps<typeof ManagerListPanel>) => {
  return render(<ManagerListPanel {...props} />);
};

const mockManagers: TourManagerSummary[] = [
  {
    managerId: "mgr1",
    managerName: "Nguyen Van Manager",
    managerEmail: "manager1@test.com",
    designerCount: 3,
    guideCount: 2,
    tourCount: 5,
    assignedStaffIds: [],
  },
  {
    managerId: "mgr2",
    managerName: "Tran Thi Manager",
    managerEmail: "manager2@test.com",
    designerCount: 1,
    guideCount: 4,
    tourCount: 8,
    assignedStaffIds: [],
  },
];

describe("ManagerListPanel", () => {
  describe("Loading state", () => {
    it("shows skeleton rows when isLoading is true", () => {
      renderComponent({
        managers: [],
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: true,
      });

      expect(screen.getByTestId("mock-skeleton-table")).toBeInTheDocument();
    });
  });

  describe("Populated state", () => {
    it("renders manager rows with initials avatar, name, email, counts", () => {
      renderComponent({
        managers: mockManagers,
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: false,
      });

      expect(screen.getByText("Nguyen Van Manager")).toBeInTheDocument();
      expect(screen.getByText("manager1@test.com")).toBeInTheDocument();
      expect(screen.getByText("NM")).toBeInTheDocument();
    });

    it("renders second manager row", () => {
      renderComponent({
        managers: mockManagers,
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: false,
      });

      expect(screen.getByText("Tran Thi Manager")).toBeInTheDocument();
      expect(screen.getByText("manager2@test.com")).toBeInTheDocument();
      expect(screen.getByText("TM")).toBeInTheDocument();
    });

    it("renders designer count badges", () => {
      renderComponent({
        managers: mockManagers,
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: false,
      });

      const badges = screen.getAllByText((_, element) => {
        if (!element) return false;
        return element.textContent === "3" || element.textContent === "1";
      });
      expect(badges.length).toBeGreaterThan(0);
    });

    it("renders guide count badges", () => {
      renderComponent({
        managers: mockManagers,
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: false,
      });

      const badges = screen.getAllByText((_, element) => {
        if (!element) return false;
        return element.textContent === "2" || element.textContent === "4";
      });
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("Selected manager", () => {
    it("highlights selected manager with amber left-border", () => {
      renderComponent({
        managers: mockManagers,
        selectedManagerId: "mgr1",
        onSelect: vi.fn(),
        isLoading: false,
      });

      const selectedRow = screen.getByText("Nguyen Van Manager").closest("button");
      expect(selectedRow).toHaveStyle({ borderLeft: "3px solid #C9873A" });
      expect(selectedRow).toHaveStyle({ backgroundColor: "#FFFBEB" });
    });

    it("non-selected manager does not have amber highlight", () => {
      renderComponent({
        managers: mockManagers,
        selectedManagerId: "mgr1",
        onSelect: vi.fn(),
        isLoading: false,
      });

      const nonSelectedRow = screen.getByText("Tran Thi Manager").closest("button");
      expect(nonSelectedRow).not.toHaveStyle({ backgroundColor: "#FFFBEB" });
    });
  });

  describe("Interaction", () => {
    it("calls onSelect with manager id when manager row is clicked", () => {
      const onSelect = vi.fn();
      renderComponent({
        managers: mockManagers,
        selectedManagerId: "",
        onSelect,
        isLoading: false,
      });

      fireEvent.click(screen.getByText("Nguyen Van Manager"));
      expect(onSelect).toHaveBeenCalledWith("mgr1");
    });

    it("calls onSelect with second manager id when second row is clicked", () => {
      const onSelect = vi.fn();
      renderComponent({
        managers: mockManagers,
        selectedManagerId: "",
        onSelect,
        isLoading: false,
      });

      fireEvent.click(screen.getByText("Tran Thi Manager"));
      expect(onSelect).toHaveBeenCalledWith("mgr2");
    });
  });

  describe("Empty state", () => {
    it("shows empty CTA when no managers exist", () => {
      renderComponent({
        managers: [],
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: false,
      });

      expect(screen.getByText("Chưa có Tour Manager")).toBeInTheDocument();
      expect(screen.getByText(/Tạo Tour Manager đầu tiên để bắt đầu/i)).toBeInTheDocument();
    });

    it("does not show empty state when managers are provided", () => {
      renderComponent({
        managers: mockManagers,
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: false,
      });

      expect(screen.queryByText("Chưa có Tour Manager")).not.toBeInTheDocument();
    });
  });

  describe("Initials generation", () => {
    it("generates initials from two-word name", () => {
      renderComponent({
        managers: [{ ...mockManagers[0], managerName: "Nguyen Van Manager" }],
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: false,
      });

      expect(screen.getByText("NM")).toBeInTheDocument();
    });

    it("generates initials from single-word name", () => {
      renderComponent({
        managers: [{ ...mockManagers[0], managerName: "Admin" }],
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: false,
      });

      expect(screen.getByText("AD")).toBeInTheDocument();
    });

    it("handles manager with zero counts", () => {
      renderComponent({
        managers: [{ ...mockManagers[0], designerCount: 0, guideCount: 0, tourCount: 0 }],
        selectedManagerId: "",
        onSelect: vi.fn(),
        isLoading: false,
      });

      expect(screen.getByText("Nguyen Van Manager")).toBeInTheDocument();
    });
  });
});
