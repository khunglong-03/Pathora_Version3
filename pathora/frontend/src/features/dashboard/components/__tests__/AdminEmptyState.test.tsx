import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AdminEmptyState } from "../AdminEmptyState";

const renderComponent = (props: React.ComponentProps<typeof AdminEmptyState>) => {
  return render(<AdminEmptyState {...props} />);
};

describe("AdminEmptyState", () => {
  it("renders heading and description", () => {
    renderComponent({
      icon: "MagnifyingGlass",
      heading: "Không tìm thấy",
      description: "Không có dữ liệu phù hợp với bộ lọc của bạn.",
    });

    expect(screen.getByText("Không tìm thấy")).toBeInTheDocument();
    expect(screen.getByText("Không có dữ liệu phù hợp với bộ lọc của bạn.")).toBeInTheDocument();
  });

  it("renders icon container", () => {
    renderComponent({
      icon: "Users",
      heading: "No Users",
      description: "Chưa có người dùng nào.",
    });

    const iconContainer = document.body.querySelector(".rounded-2xl");
    expect(iconContainer).toBeTruthy();
  });

  it("renders action button when action is provided", () => {
    const onAction = vi.fn();
    renderComponent({
      icon: "Plus",
      heading: "Thêm mới",
      description: "Bắt đầu bằng cách thêm một mục mới.",
      action: { label: "Tạo mới", onClick: onAction },
    });

    const btn = screen.getByRole("button", { name: /Tạo mới/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not render action when omitted", () => {
    renderComponent({
      icon: "Info",
      heading: "Info",
      description: "Some info.",
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has flex center layout", () => {
    renderComponent({
      icon: "Ghost",
      heading: "Empty",
      description: "Nothing here.",
    });

    const container = screen.getByTestId("admin-empty-state");
    expect(container.className).toMatch(/flex/);
  });

  it("action button uses amber accent color", () => {
    const onAction = vi.fn();
    renderComponent({
      icon: "Star",
      heading: "Empty",
      description: "Nothing here.",
      action: { label: "Add", onClick: onAction },
    });

    const btn = screen.getByRole("button", { name: /Add/i });
    expect(btn).toHaveStyle({ backgroundColor: "#C9873A" });
  });
});
