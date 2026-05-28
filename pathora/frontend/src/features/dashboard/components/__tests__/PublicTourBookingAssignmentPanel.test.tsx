import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PublicTourBookingAssignmentPanel from "../PublicTourBookingAssignmentPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string | Record<string, any>, options?: any) => {
      if (typeof fallback === "string") return fallback;
      if (fallback && typeof fallback === "object") {
        if (typeof fallback.defaultValue === "string") return fallback.defaultValue;
      }
      if (options && typeof options === "object") {
        if (typeof options.defaultValue === "string") return options.defaultValue;
      }
      return _key;
    }
  }),
}));

vi.mock("@/components/ui", () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

vi.mock("@/components/ui/Button", () => ({
  default: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("@/components/ui/Select", () => ({
  default: ({ label, value, onChange, options }: any) => (
    <div>
      <label>{label}</label>
      <select value={value} onChange={onChange}>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock("@/components/ui/TextInput", () => ({
  default: ({ label, value, onChange }: any) => (
    <div>
      <label>{label}</label>
      <input value={value} onChange={onChange} />
    </div>
  ),
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    deleteBookingRoomAssignment: vi.fn(),
  },
}));

vi.mock("@/api/services/supplierService", () => ({
  supplierService: {
    getSuppliers: vi.fn().mockResolvedValue([]),
    getSupplierAccommodations: vi.fn().mockResolvedValue([]),
  },
}));

describe("PublicTourBookingAssignmentPanel", () => {
  const defaultProps = {
    instanceId: "instance-1",
    instanceType: "public" as const,
    bookings: [
      {
        id: "booking-1",
        customerName: "Lan Nguyen",
        status: "Confirmed",
      } as any,
    ],
    bookingsLoading: false,
    accommodationActivities: [],
    externalTransportActivities: [],
    continent: "Asia",
  };

  it("renders blocker banner without CTA when supplierNotAssigned", () => {
    const activities = [
      {
        activityId: "act-1",
        title: "Accommodation Day 1",
        date: "2026-06-01",
        dayNumber: 1,
        roomBlocksTotal: 0,
        quantity: 0, // supplierNotAssigned since quantity is 0
        roomType: null,
        supplierName: null,
        supplierApprovalStatus: null,
      },
    ];

    render(
      <PublicTourBookingAssignmentPanel
        {...defaultProps}
        accommodationActivities={activities}
      />,
    );

    expect(screen.getByText("Chưa giao khách sạn cho activity này")).toBeInTheDocument();
    // Verify that NO CTA button exists
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders blocker banner without CTA when supplier isRejected", () => {
    const activities = [
      {
        activityId: "act-1",
        title: "Accommodation Day 1",
        date: "2026-06-01",
        dayNumber: 1,
        roomBlocksTotal: 0,
        quantity: 2,
        roomType: "Double",
        supplierName: "Hotel Metropole",
        supplierApprovalStatus: "Rejected", // isRejected
      },
    ];

    render(
      <PublicTourBookingAssignmentPanel
        {...defaultProps}
        accommodationActivities={activities}
      />,
    );

    expect(screen.getByText("Khách sạn đã từ chối activity này")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders blocker banner for pending approval", () => {
    const activities = [
      {
        activityId: "act-1",
        title: "Accommodation Day 1",
        date: "2026-06-01",
        dayNumber: 1,
        roomBlocksTotal: 0,
        quantity: 2,
        roomType: "Double",
        supplierName: "Hotel Metropole",
        supplierApprovalStatus: "Pending",
      },
    ];

    render(
      <PublicTourBookingAssignmentPanel
        {...defaultProps}
        accommodationActivities={activities}
      />,
    );

    expect(screen.getByText("Đang chờ khách sạn duyệt")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders zero-bookings tour panel without crash", () => {
    const activities = [
      {
        activityId: "act-1",
        title: "Accommodation Day 1",
        date: "2026-06-01",
        dayNumber: 1,
        roomBlocksTotal: 0,
        quantity: 2,
        roomType: "Double",
        supplierName: "Hotel Metropole",
        supplierApprovalStatus: "Approved",
      },
    ];

    const { container } = render(
      <PublicTourBookingAssignmentPanel
        {...defaultProps}
        bookings={[]}
        accommodationActivities={activities}
      />,
    );

    expect(container).toBeInTheDocument();
    expect(screen.getByText("Chưa có booking nào cho tour instance này.")).toBeInTheDocument();
  });
});
