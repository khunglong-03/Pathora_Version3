import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AdminFilterTabs } from "../AdminFilterTabs";

const renderComponent = (props: React.ComponentProps<typeof AdminFilterTabs>) => {
  return render(<AdminFilterTabs {...props} />);
};

describe("AdminFilterTabs", () => {
  const tabs = [
    { label: "All", value: "all" },
    { label: "Admin", value: "admin", count: 3 },
    { label: "Manager", value: "manager", count: 12 },
    { label: "TourGuide", value: "tourguide", count: 0 },
  ];

  it("renders all tabs with labels", () => {
    renderComponent({ tabs, activeValue: "all", onChange: () => {} });

    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Admin3" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Manager12" })).toBeInTheDocument();
  });

  it("renders count badges when provided with count > 0", () => {
    renderComponent({ tabs, activeValue: "all", onChange: () => {} });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("does not render badge for count=0", () => {
    renderComponent({ tabs, activeValue: "all", onChange: () => {} });

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("active tab has visual indicator via aria-selected", () => {
    renderComponent({ tabs, activeValue: "admin", onChange: () => {} });

    const adminTab = screen.getByRole("tab", { name: "Admin3" });
    expect(adminTab).toHaveAttribute("aria-selected", "true");
  });

  it("inactive tab does not have aria-selected=true", () => {
    renderComponent({ tabs, activeValue: "admin", onChange: () => {} });

    const managerTab = screen.getByRole("tab", { name: "Manager12" });
    expect(managerTab).toHaveAttribute("aria-selected", "false");
  });

  it("onChange called with correct value when tab is clicked", () => {
    const onChange = vi.fn();
    renderComponent({ tabs, activeValue: "all", onChange });

    fireEvent.click(screen.getByRole("tab", { name: "Admin3" }));

    expect(onChange).toHaveBeenCalledWith("admin");
  });

  it("onChange called only once per click", () => {
    const onChange = vi.fn();
    renderComponent({ tabs, activeValue: "all", onChange });

    fireEvent.click(screen.getByRole("tab", { name: "Admin3" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("admin");
  });

  it("handles empty tabs array", () => {
    renderComponent({ tabs: [], activeValue: "", onChange: () => {} });

    expect(document.body.textContent).toBe("");
  });

  it("handles single tab", () => {
    renderComponent({ tabs: [{ label: "Only", value: "only" }], activeValue: "only", onChange: () => {} });

    expect(screen.getByRole("tab", { name: "Only" })).toBeInTheDocument();
  });

  it("handles tab with only label and no count", () => {
    renderComponent({ tabs: [{ label: "Zero", value: "zero" }], activeValue: "zero", onChange: () => {} });

    expect(screen.getByRole("tab", { name: "Zero" })).toBeInTheDocument();
  });
});
