import "@testing-library/jest-dom/vitest";
import { describe, expect, it, fn, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { TourManagerCard } from "../TourManagerCard";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

const renderComponent = (props: React.ComponentProps<typeof TourManagerCard>) => {
  return render(<TourManagerCard {...props} />);
};

const mockManager: TourManagerSummary = {
  managerId: "mgr1",
  managerName: "Nguyen Van Manager",
  managerEmail: "manager@test.com",
  designerCount: 5,
  guideCount: 8,
  tourCount: 12,
};

describe("TourManagerCard", () => {
  it("renders avatar with manager initials", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    expect(screen.getByText("NM")).toBeInTheDocument();
  });

  it("renders manager name, email", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    expect(screen.getByText("Nguyen Van Manager")).toBeInTheDocument();
    expect(screen.getByText("manager@test.com")).toBeInTheDocument();
  });

  it("renders stat chips with designer count", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    expect(screen.getByText("Designers: 5")).toBeInTheDocument();
  });

  it("renders stat chips with guide count", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    expect(screen.getByText("Guides: 8")).toBeInTheDocument();
  });

  it("renders stat chips with tour count", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    expect(screen.getByText("Tours: 12")).toBeInTheDocument();
  });

  it("stat chip for designer has purple accent", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    const designerChip = screen.getByText("Designers: 5");
    expect(designerChip.closest(".rounded-full")).toHaveStyle({ backgroundColor: "#EDE9FE" });
  });

  it("stat chip for guide has blue accent", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    const guideChip = screen.getByText("Guides: 8");
    expect(guideChip.closest(".rounded-full")).toHaveStyle({ backgroundColor: "#DBEAFE" });
  });

  it("stat chip for tours has green accent", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    const tourChip = screen.getByText("Tours: 12");
    expect(tourChip.closest(".rounded-full")).toHaveStyle({ backgroundColor: "#DCFCE7" });
  });

  it("view staff button present", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    expect(screen.getByRole("button", { name: /xem nhân viên/i })).toBeInTheDocument();
  });

  it("edit button present", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    expect(screen.getByLabelText("Edit manager")).toBeInTheDocument();
  });

  it("calls onViewStaff with manager id when view staff button is clicked", () => {
    const onViewStaff = vi.fn();
    renderComponent({ manager: mockManager, onViewStaff, onEdit: () => {} });

    fireEvent.click(screen.getByRole("button", { name: /xem nhân viên/i }));

    expect(onViewStaff).toHaveBeenCalledWith("mgr1");
  });

  it("calls onEdit with manager id when edit button is clicked", () => {
    const onEdit = vi.fn();
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit });

    fireEvent.click(screen.getByLabelText("Edit manager"));

    expect(onEdit).toHaveBeenCalledWith("mgr1");
  });

  it("has diffusion shadow styling via box-shadow", () => {
    renderComponent({ manager: mockManager, onViewStaff: () => {}, onEdit: () => {} });

    const card = screen.getByTestId("tour-manager-card");
    expect(card.getAttribute("style") || "").toMatch(/shadow/);
  });

  it("handles manager with zero counts", () => {
    const zeroManager: TourManagerSummary = {
      ...mockManager,
      designerCount: 0,
      guideCount: 0,
      tourCount: 0,
    };
    renderComponent({ manager: zeroManager, onViewStaff: () => {}, onEdit: () => {} });

    expect(screen.getByText("Designers: 0")).toBeInTheDocument();
    expect(screen.getByText("Guides: 0")).toBeInTheDocument();
    expect(screen.getByText("Tours: 0")).toBeInTheDocument();
  });
});
