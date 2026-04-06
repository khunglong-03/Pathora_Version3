import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { StaffList } from "../StaffList";
import type { StaffMemberDto } from "@/types/admin";
import type { TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

const renderComponent = (props: React.ComponentProps<typeof StaffList>) => {
  return render(<StaffList {...props} />);
};

describe("StaffList", () => {
  const mockStaff: StaffMemberDto[] = [
    { id: "s1", fullName: "Designer One", email: "d1@test.com", role: "TourDesigner", status: "Active" },
    { id: "s2", fullName: "Guide One", email: "g1@test.com", role: "TourGuide", status: "Active" },
    { id: "s3", fullName: "Designer Two", email: "d2@test.com", role: "TourDesigner", status: "Active" },
  ];

  const mockManagers: TourManagerSummary[] = [
    { managerId: "mgr1", managerName: "Manager One", managerEmail: "m1@test.com", designerCount: 2, guideCount: 1, tourCount: 5, assignedStaffIds: [] },
    { managerId: "mgr2", managerName: "Manager Two", managerEmail: "m2@test.com", designerCount: 3, guideCount: 2, tourCount: 8, assignedStaffIds: [] },
  ];

  it("renders staff item with fullName, email, role", () => {
    renderComponent({ staff: mockStaff, managers: mockManagers, managerId: "mgr1", onReassign: () => {} });

    expect(screen.getByText("Designer One")).toBeInTheDocument();
    expect(screen.getByText("d1@test.com")).toBeInTheDocument();
    expect(screen.getByText("Tour Designer")).toBeInTheDocument();
  });

  it("renders TourDesigner section header", () => {
    renderComponent({ staff: mockStaff, managers: mockManagers, managerId: "mgr1", onReassign: () => {} });

    expect(screen.getByText(/Tour Designer/i)).toBeInTheDocument();
  });

  it("renders TourGuide section header", () => {
    renderComponent({ staff: mockStaff, managers: mockManagers, managerId: "mgr1", onReassign: () => {} });

    expect(screen.getByText(/Tour Guide/i)).toBeInTheDocument();
  });

  it("renders reassign button per staff when other managers exist", () => {
    renderComponent({ staff: mockStaff, managers: mockManagers, managerId: "mgr1", onReassign: () => {} });

    const reassignBtns = screen.getAllByRole("button", { name: /Reassign/i });
    expect(reassignBtns.length).toBeGreaterThan(0);
  });

  it("calls onReassign with staff member when reassign button is clicked", () => {
    const onReassign = vi.fn();
    renderComponent({ staff: mockStaff, managers: mockManagers, managerId: "mgr1", onReassign });

    const reassignBtn = screen.getByRole("button", { name: /Reassign Designer One/i });
    fireEvent.click(reassignBtn);

    expect(onReassign).toHaveBeenCalled();
    const calledMember = onReassign.mock.calls[0][0] as StaffMemberDto;
    expect(calledMember.id).toBe("s1");
  });

  it("empty state when no staff", () => {
    renderComponent({ staff: [], managers: mockManagers, managerId: "mgr1", onReassign: () => {} });

    expect(screen.getByText(/không có nhân viên/i)).toBeInTheDocument();
  });

  it("does not render empty state when staff is provided", () => {
    renderComponent({ staff: mockStaff, managers: mockManagers, managerId: "mgr1", onReassign: () => {} });

    expect(screen.queryByText(/không có nhân viên/i)).not.toBeInTheDocument();
  });
});
