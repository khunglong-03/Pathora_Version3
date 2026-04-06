import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { StaffReassignModal } from "../StaffReassignModal";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

const renderComponent = (props: React.ComponentProps<typeof StaffReassignModal>) => {
  return render(<StaffReassignModal {...props} />);
};

describe("StaffReassignModal", () => {
  const mockManagers: TourManagerSummary[] = [
    { managerId: "mgr1", managerName: "Manager One", managerEmail: "m1@test.com", designerCount: 2, guideCount: 1, tourCount: 5, assignedStaffIds: [] },
    { managerId: "mgr2", managerName: "Manager Two", managerEmail: "m2@test.com", designerCount: 3, guideCount: 2, tourCount: 8, assignedStaffIds: [] },
    { managerId: "mgr3", managerName: "Manager Three", managerEmail: "m3@test.com", designerCount: 1, guideCount: 3, tourCount: 3, assignedStaffIds: [] },
  ];

  it("renders modal when isOpen is true", () => {
    renderComponent({
      isOpen: true,
      staffName: "Nguyen Designer",
      currentManager: "Manager One",
      allManagers: mockManagers,
      onConfirm: vi.fn(),
      onClose: vi.fn(),
    });

    expect(screen.getByText("Chuyển nhân viên")).toBeInTheDocument();
    expect(screen.getByText("Nguyen Designer")).toBeInTheDocument();
    expect(screen.getByText(/Hiện tại: Manager One/i)).toBeInTheDocument();
  });

  it("renders dropdown with all managers", () => {
    renderComponent({
      isOpen: true,
      staffName: "Nguyen Designer",
      currentManager: "Manager One",
      allManagers: mockManagers,
      onConfirm: vi.fn(),
      onClose: vi.fn(),
    });

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("confirm button is disabled without selection", () => {
    renderComponent({
      isOpen: true,
      staffName: "Nguyen Designer",
      currentManager: "Manager One",
      allManagers: mockManagers,
      onConfirm: vi.fn(),
      onClose: vi.fn(),
    });

    expect(screen.getByRole("button", { name: /Xác nhận/i })).toBeDisabled();
  });

  it("confirm button enabled when different manager selected", () => {
    renderComponent({
      isOpen: true,
      staffName: "Nguyen Designer",
      currentManager: "Manager One",
      allManagers: mockManagers,
      onConfirm: vi.fn(),
      onClose: vi.fn(),
    });

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mgr2" } });

    expect(screen.getByRole("button", { name: /Xác nhận/i })).not.toBeDisabled();
  });

  it("calls onConfirm with target manager id on confirm", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderComponent({
      isOpen: true,
      staffName: "Nguyen Designer",
      currentManager: "Manager One",
      allManagers: mockManagers,
      onConfirm,
      onClose: vi.fn(),
    });

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mgr2" } });
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

    // Wait for async onConfirm to be called
    await vi.waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("mgr2");
    });
  });

  it("calls onClose on cancel", () => {
    const onClose = vi.fn();
    renderComponent({
      isOpen: true,
      staffName: "Nguyen Designer",
      currentManager: "Manager One",
      allManagers: mockManagers,
      onConfirm: vi.fn(),
      onClose,
    });

    fireEvent.click(screen.getByRole("button", { name: /Hủy/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders loading state when confirm is in progress", async () => {
    const onConfirm = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 500)));
    renderComponent({
      isOpen: true,
      staffName: "Nguyen Designer",
      currentManager: "Manager One",
      allManagers: mockManagers,
      onConfirm,
      onClose: vi.fn(),
    });

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mgr2" } });
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận/i }));

    await vi.waitFor(() => {
      expect(screen.getByText("Đang xử lý...")).toBeInTheDocument();
    });
  });

  it("returns null when isOpen is false", () => {
    renderComponent({
      isOpen: false,
      staffName: "Nguyen Designer",
      currentManager: "Manager One",
      allManagers: mockManagers,
      onConfirm: vi.fn(),
      onClose: vi.fn(),
    });

    expect(screen.queryByText("Chuyển nhân viên")).not.toBeInTheDocument();
  });
});
