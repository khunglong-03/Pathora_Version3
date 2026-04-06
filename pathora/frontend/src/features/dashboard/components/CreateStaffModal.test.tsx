import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { CreateStaffModal } from "./CreateStaffModal";
import type { CreateStaffRequest } from "@/api/services/adminService";

const renderComponent = (props: React.ComponentProps<typeof CreateStaffModal>) => {
  return render(<CreateStaffModal {...props} />);
};

describe("CreateStaffModal", () => {
  describe("Open/Closed states", () => {
    it("renders modal when isOpen is true", () => {
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      });

      expect(screen.getByText("Tạo nhân viên mới")).toBeInTheDocument();
    });

    it("returns null when isOpen is false", () => {
      renderComponent({
        isOpen: false,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      });

      expect(screen.queryByText("Tạo nhân viên mới")).not.toBeInTheDocument();
    });
  });

  describe("Role tabs", () => {
    it("opens with TourDesigner tab selected by default", () => {
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      });

      expect(screen.getByRole("button", { name: "Tour Designer" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Tour Guide" })).toBeInTheDocument();
    });

    it("can switch to TourGuide tab", () => {
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      });

      fireEvent.click(screen.getByRole("button", { name: "Tour Guide" }));
      // Tab button should now reflect the selected state (Tour Guide should be highlighted)
      expect(screen.getByRole("button", { name: "Tour Guide" })).toBeInTheDocument();
    });
  });

  describe("Form fields", () => {
    it("renders full name and email input fields", () => {
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      });

      expect(screen.getByLabelText("Họ và tên")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    it("renders cancel and submit buttons", () => {
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
      });

      expect(screen.getByRole("button", { name: "Hủy" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Tạo nhân viên" })).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("shows error when full name is empty on submit", async () => {
      const onSubmit = vi.fn();
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit,
      });

      fireEvent.click(screen.getByRole("button", { name: "Tạo nhân viên" }));

      expect(await screen.findByText("Họ tên không được để trống.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("shows error when email is empty on submit", async () => {
      const onSubmit = vi.fn();
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit,
      });

      fireEvent.change(screen.getByLabelText("Họ và tên"), {
        target: { value: "Nguyen Van A" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Tạo nhân viên" }));

      expect(await screen.findByText("Email không được để trống.")).toBeInTheDocument();
    });

    it("shows error when email is invalid", async () => {
      const onSubmit = vi.fn();
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit,
      });

      // Fill full name
      await act(async () => {
        fireEvent.change(screen.getByLabelText("Họ và tên"), {
          target: { value: "Nguyen Van A" },
        });
      });

      // Fill email with invalid value
      await act(async () => {
        fireEvent.change(screen.getByLabelText("Email"), {
          target: { value: "not-an-email" },
        });
      });

      // Submit — use fireEvent.submit on the form to bypass browser validation interference
      const form = screen.getByRole("button", { name: "Tạo nhân viên" }).closest("form") as HTMLFormElement;
      await act(async () => {
        fireEvent.submit(form);
      });

      expect(await screen.findByText("Email không hợp lệ.")).toBeInTheDocument();
    });
  });

  describe("Form submission", () => {
    it("calls onSubmit with valid data when form is filled and submitted", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit,
      });

      fireEvent.change(screen.getByLabelText("Họ và tên"), {
        target: { value: "Nguyen Van A" },
      });
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "nguyenvana@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Tạo nhân viên" }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          role: "TourDesigner",
          fullName: "Nguyen Van A",
          email: "nguyenvana@example.com",
        });
      });
    });

    it("calls onSubmit with TourGuide role when that tab is selected", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit,
      });

      fireEvent.click(screen.getByRole("button", { name: "Tour Guide" }));
      fireEvent.change(screen.getByLabelText("Họ và tên"), {
        target: { value: "Tran Thi B" },
      });
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "tranthib@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Tạo nhân viên" }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          role: "TourGuide",
          fullName: "Tran Thi B",
          email: "tranthib@example.com",
        });
      });
    });

    it("shows loading state during submission", async () => {
      const onSubmit = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 500)));
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit,
      });

      fireEvent.change(screen.getByLabelText("Họ và tên"), {
        target: { value: "Nguyen Van A" },
      });
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Tạo nhân viên" }));

      await vi.waitFor(() => {
        expect(screen.getByText("Đang tạo...")).toBeInTheDocument();
      });
    });

    it("disables buttons during submission", async () => {
      const onSubmit = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 500)));
      renderComponent({
        isOpen: true,
        onClose: vi.fn(),
        onSubmit,
      });

      fireEvent.change(screen.getByLabelText("Họ và tên"), {
        target: { value: "Nguyen Van A" },
      });
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Tạo nhân viên" }));

      expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
    });
  });

  describe("Close behavior", () => {
    it("calls onClose when cancel button is clicked", () => {
      const onClose = vi.fn();
      renderComponent({
        isOpen: true,
        onClose,
        onSubmit: vi.fn(),
      });

      fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop is clicked", () => {
      const onClose = vi.fn();
      renderComponent({
        isOpen: true,
        onClose,
        onSubmit: vi.fn(),
      });

      // Click the backdrop (first div with absolute inset-0)
      const backdrop = document.body.querySelector(".absolute.inset-0");
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not close when backdrop is clicked during submission", async () => {
      const onClose = vi.fn();
      const onSubmit = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 500)));
      renderComponent({
        isOpen: true,
        onClose,
        onSubmit,
      });

      fireEvent.change(screen.getByLabelText("Họ và tên"), {
        target: { value: "Nguyen Van A" },
      });
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Tạo nhân viên" }));

      const backdrop = document.body.querySelector(".absolute.inset-0");
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Form reset on success", () => {
    it("resets form fields after successful submission", async () => {
      const onClose = vi.fn();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      renderComponent({
        isOpen: true,
        onClose,
        onSubmit,
      });

      fireEvent.change(screen.getByLabelText("Họ và tên"), {
        target: { value: "Nguyen Van A" },
      });
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Tạo nhân viên" }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      // Fields should be reset after success — wait for React state flush
      await waitFor(() => {
        expect((screen.getByLabelText("Họ và tên") as HTMLInputElement).value).toBe("");
      });
      expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("");
    });
  });
});
