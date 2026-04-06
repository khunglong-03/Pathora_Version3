import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { AdminPageHeader } from "../AdminPageHeader";

const renderComponent = (props: React.ComponentProps<typeof AdminPageHeader>) => {
  return render(<AdminPageHeader {...props} />);
};

describe("AdminPageHeader", () => {
  it("renders title and subtitle", () => {
    renderComponent({ title: "Quản lý người dùng", subtitle: "Danh sách người dùng hệ thống" });

    expect(screen.getByText("Quản lý người dùng")).toBeInTheDocument();
    expect(screen.getByText("Danh sách người dùng hệ thống")).toBeInTheDocument();
  });

  it("renders only title when subtitle is omitted", () => {
    renderComponent({ title: "Dashboard" });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders back button when backHref is provided", () => {
    renderComponent({ title: "User Detail", backHref: "/admin/users" });

    expect(screen.getByLabelText("Go back")).toHaveAttribute("href", "/admin/users");
  });

  it("back button links to correct href", () => {
    renderComponent({ title: "Detail", backHref: "/admin/tour-managers" });

    expect(screen.getByLabelText("Go back")).toHaveAttribute("href", "/admin/tour-managers");
  });

  it("does not render back button when backHref is omitted", () => {
    renderComponent({ title: "No Back" });

    expect(screen.queryByRole("link", { name: /go back/i })).not.toBeInTheDocument();
  });

  it("renders refresh button when onRefresh is provided", () => {
    renderComponent({ title: "Refresh Test", onRefresh: () => {} });

    const btns = screen.getAllByRole("button", { name: /refresh/i });
    expect(btns).toHaveLength(1);
  });

  it("refresh button is clickable and calls onRefresh", () => {
    const onRefresh = vi.fn();
    renderComponent({ title: "Refresh Test", onRefresh });

    const btn = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(btn);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("renders custom action buttons", () => {
    const onClick = vi.fn();
    renderComponent({
      title: "With Actions",
      actionButtons: (
        <button data-testid="action-btn" onClick={onClick}>
          Thêm mới
        </button>
      ),
    });

    const btn = screen.getByTestId("action-btn");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent("Thêm mới");

    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is sticky by using position sticky", () => {
    renderComponent({ title: "Sticky Header" });

    const header = screen.getByTestId("admin-page-header");
    expect(header).toHaveClass("sticky");
  });
});
