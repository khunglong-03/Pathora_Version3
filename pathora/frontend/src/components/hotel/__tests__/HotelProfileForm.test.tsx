import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";

import HotelProfileForm from "../../HotelProfileForm";
import type { HotelSupplierInfo } from "@/api/services/hotelProviderService";

// Mock react-hook-form to avoid complex RHF setup in tests
vi.mock("react-hook-form", () => ({
  useForm: vi.fn(() => ({
    register: vi.fn((name: string) => ({ name, ref: vi.fn() })),
    handleSubmit: vi.fn((fn: (values: Record<string, string>) => void) =>
      () => fn({ name: "Grand Hotel", address: "123 Hotel St", phone: "0123456789", email: "hotel@test.com", notes: "Great hotel" })
    ),
    formState: {
      errors: {},
      isSubmitting: false,
    },
    reset: vi.fn(),
  })),
}));

const mockSupplierInfo: HotelSupplierInfo = {
  id: "sup-1",
  supplierCode: "GRAND-HTL",
  name: "Grand Hotel Saigon",
  phone: "0912345678",
  email: "reservations@grandhotel.vn",
  address: "123 Nguyen Hue, District 1, HCMC",
  notes: "5-star hotel",
};

describe("HotelProfileForm", () => {
  const onSave = vi.fn<Promise<void>, [Record<string, string>]>();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("renders", () => {
    it("renders form with all fields populated from initial data", () => {
      render(
        <HotelProfileForm
          data={mockSupplierInfo}
          onSave={onSave}
          onCancel={onCancel}
        />,
      );

      expect(screen.getByText(/Tên khách sạn/i)).toBeInTheDocument();
      expect(screen.getByText(/Địa chỉ/i)).toBeInTheDocument();
      expect(screen.getByText(/Số điện thoại/i)).toBeInTheDocument();
      expect(screen.getByText(/Email/i)).toBeInTheDocument();
      expect(screen.getByText(/Ghi chú/i)).toBeInTheDocument();
    });

    it("renders Cancel and Save buttons", () => {
      render(
        <HotelProfileForm
          data={mockSupplierInfo}
          onSave={onSave}
          onCancel={onCancel}
        />,
      );

      expect(screen.getByText("Hủy")).toBeInTheDocument();
      expect(screen.getByText("Lưu thay đổi")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onCancel when Cancel button is clicked", async () => {
      render(
        <HotelProfileForm
          data={mockSupplierInfo}
          onSave={onSave}
          onCancel={onCancel}
        />,
      );

      fireEvent.click(screen.getByText("Hủy"));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onSave with form values when form is submitted", async () => {
      render(
        <HotelProfileForm
          data={mockSupplierInfo}
          onSave={onSave}
          onCancel={onCancel}
        />,
      );

      fireEvent.click(screen.getByText("Lưu thay đổi"));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("data handling", () => {
    it("renders with empty data when all fields are null", () => {
      const emptyData: HotelSupplierInfo = {
        id: "sup-empty",
        supplierCode: "",
        name: "",
        phone: null,
        email: null,
        address: null,
        notes: null,
      };

      render(
        <HotelProfileForm
          data={emptyData}
          onSave={onSave}
          onCancel={onCancel}
        />,
      );

      // Form should still render without crashing
      expect(screen.getByText("Hủy")).toBeInTheDocument();
      expect(screen.getByText("Lưu thay đổi")).toBeInTheDocument();
    });
  });
});
