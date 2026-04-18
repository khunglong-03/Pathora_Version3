import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSupplierModal } from "../CreateSupplierModal";
import { createSupplierWithOwner } from "@/api/services/adminSupplierService";

// Mock the services and translations
vi.mock("@/api/services/adminSupplierService", () => ({
  createSupplierWithOwner: vi.fn().mockResolvedValue({ id: "1" }),
}));

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
    initReactI18next: {
      type: "3rdParty",
      init: vi.fn(),
    },
  };
});

vi.mock("@phosphor-icons/react", () => ({
  BuildingsIcon: () => <div data-testid="buildings-icon" />,
  VanIcon: () => <div data-testid="van-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
}));

describe("CreateSupplierModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires continent field for Transport supplier", async () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    render(
      <CreateSupplierModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        supplierType="Transport"
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText("adminSupplierModal.fields.supplierCode *"), {
      target: { value: "TR-001" },
    });
    fireEvent.change(screen.getByLabelText("adminSupplierModal.fields.supplierName *"), {
      target: { value: "Transport Supplier" },
    });
    fireEvent.change(screen.getByLabelText("adminSupplierModal.fields.ownerFullName *"), {
      target: { value: "Owner Name" },
    });
    fireEvent.change(screen.getByLabelText("adminSupplierModal.fields.ownerEmail *"), {
      target: { value: "owner@example.com" },
    });

    // Try to submit without filling continent
    fireEvent.click(screen.getByText("adminSupplierModal.actions.create"));

    // Verify validation error
    await waitFor(() => {
      expect(screen.getByText("adminSupplierModal.validation.primaryContinentRequired")).toBeInTheDocument();
    });

    // Submit should not have been called
    expect(createSupplierWithOwner).not.toHaveBeenCalled();

    // Now select a continent
    fireEvent.change(screen.getByLabelText("adminSupplierModal.fields.primaryContinent *"), {
      target: { value: "Americas" },
    });

    // Try to submit again
    fireEvent.click(screen.getByText("adminSupplierModal.actions.create"));

    // Submit should have been called
    await waitFor(() => {
      expect(createSupplierWithOwner).toHaveBeenCalled();
    });
  });
});
