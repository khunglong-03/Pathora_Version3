import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { AdminUserTable } from "../AdminUserTable";
import type { AdminUserListItem } from "@/api/services/adminService";

const renderComponent = (props: React.ComponentProps<typeof AdminUserTable>) => {
  return render(<AdminUserTable {...props} />);
};

const mockUsers: AdminUserListItem[] = [
  { id: "1", fullName: "Nguyen Van A", email: "nvana@test.com", role: "Admin", status: "Active" },
  { id: "2", fullName: "Tran Thi B", email: "ttb@test.com", role: "Manager", status: "Active" },
  { id: "3", fullName: "Le Van C", email: "lvc@test.com", role: "TourGuide", status: "Inactive" },
  { id: "4", fullName: "Pham Thi D", email: "ptd@test.com", role: "TourOperator", status: "Active" },
  { id: "5", fullName: "Hoang Van E", email: "hve@test.com", role: "Customer", status: "Active" },
];

describe("AdminUserTable", () => {
  it("renders table with correct columns", () => {
    renderComponent({ users: mockUsers, isLoading: false });

    expect(screen.getByText("Họ tên")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Vai trò")).toBeInTheDocument();
    expect(screen.getByText("Trạng thái")).toBeInTheDocument();
    expect(screen.getByText("Hành động")).toBeInTheDocument();
  });

  it("renders avatar with user initials", () => {
    renderComponent({ users: mockUsers, isLoading: false });

    expect(screen.getByText("NA")).toBeInTheDocument();
    expect(screen.getByText("TB")).toBeInTheDocument();
  });

  it("renders role badge with correct color per role", () => {
    renderComponent({ users: mockUsers, isLoading: false });

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("renders status indicator green for active", () => {
    renderComponent({ users: [mockUsers[0]], isLoading: false });

    const dot = screen.getByTestId("status-dot-1");
    expect(dot).toHaveStyle({ backgroundColor: "#22C55E" });
    expect(screen.getByText("Hoạt động")).toBeInTheDocument();
  });

  it("renders status indicator gray for inactive", () => {
    renderComponent({ users: [mockUsers[2]], isLoading: false });

    const dot = screen.getByTestId("status-dot-3");
    expect(dot).toHaveStyle({ backgroundColor: "#9CA3AF" });
    expect(screen.getByText("Khóa")).toBeInTheDocument();
  });

  it("renders action menu button per row", () => {
    renderComponent({ users: mockUsers, isLoading: false });

    const actionBtns = screen.getAllByRole("button", { name: /actions/i });
    expect(actionBtns).toHaveLength(5);
  });

  it("action menu opens on click", () => {
    renderComponent({ users: [mockUsers[0]], isLoading: false });

    const actionBtn = screen.getByRole("button", { name: /actions/i });
    fireEvent.click(actionBtn);

    expect(screen.getByText("Xem chi tiết")).toBeInTheDocument();
  });

  it("action menu shows 'Xem chi tiết' after opening", () => {
    renderComponent({ users: [mockUsers[0]], isLoading: false });

    const actionBtn = screen.getByRole("button", { name: /actions/i });
    fireEvent.click(actionBtn);

    expect(screen.getByText("Xem chi tiết")).toBeInTheDocument();
  });

  it("detail page link exists in user row dropdown", () => {
    renderComponent({ users: [mockUsers[0]], isLoading: false });

    const actionBtn = screen.getByRole("button", { name: /actions/i });
    fireEvent.click(actionBtn);

    const link = document.body.querySelector('a[href="/admin/users/1"]');
    expect(link).toBeInTheDocument();
  });

  it("row has hover lift effect via translateY transform", () => {
    renderComponent({ users: [mockUsers[0]], isLoading: false });

    const rows = document.body.querySelectorAll("[style*=\"translateY\"]");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("pagination controls render when totalPages > 1", () => {
    renderComponent({
      users: mockUsers,
      isLoading: false,
      currentPage: 1,
      totalPages: 5,
      total: 50,
      onPageChange: () => {},
    });

    expect(screen.getByText(/1–10 trong 50/)).toBeInTheDocument();
  });

  it("pagination component is rendered when totalPages > 1", () => {
    renderComponent({
      users: mockUsers,
      isLoading: false,
      currentPage: 1,
      totalPages: 5,
      total: 50,
      onPageChange: () => {},
    });

    expect(screen.getByTestId("mock-pagination")).toBeInTheDocument();
  });

  it("renders skeleton rows when loading", () => {
    renderComponent({ users: [], isLoading: true });

    expect(screen.getByTestId("mock-skeleton-table")).toBeInTheDocument();
  });

  it("returns null (renders nothing) when users array is empty and not loading", () => {
    renderComponent({ users: [], isLoading: false });

    expect(screen.queryByText("Họ tên")).not.toBeInTheDocument();
  });

  it("renders Customer role badge", () => {
    renderComponent({ users: [mockUsers[4]], isLoading: false });

    expect(screen.getByText("Customer")).toBeInTheDocument();
  });
});
