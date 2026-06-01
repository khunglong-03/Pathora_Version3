import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerAddParticipants } from "../CustomerAddParticipants";
import { bookingService } from "@/api/services/bookingService";
import { toast } from "react-toastify";

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("react-i18next", () => {
  const t = (_key: string, fallback?: string) => fallback ?? _key;
  return {
    useTranslation: () => ({ t }),
  };
});

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getParticipants: vi.fn(),
    getBookingDetail: vi.fn(),
    createParticipant: vi.fn(),
    updateParticipant: vi.fn(),
    upsertParticipantPassport: vi.fn(),
    submitVisaApplication: vi.fn(),
    requestVisaSupport: vi.fn(),
  },
}));

vi.mock("@/api/services/fileService", () => ({
  fileService: {
    uploadFile: vi.fn(),
  },
}));

describe("CustomerAddParticipants", () => {
  const getParticipantsMock = vi.mocked(bookingService.getParticipants);
  const getBookingDetailMock = vi.mocked(bookingService.getBookingDetail);
  const createParticipantMock = vi.mocked(bookingService.createParticipant);
  const updateParticipantMock = vi.mocked(bookingService.updateParticipant);
  const upsertParticipantPassportMock = vi.mocked(bookingService.upsertParticipantPassport);
  const submitVisaApplicationMock = vi.mocked(bookingService.submitVisaApplication);
  const requestVisaSupportMock = vi.mocked(bookingService.requestVisaSupport);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders guest cards based on booking details", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: false,
    } as any);
    getParticipantsMock.mockResolvedValue([]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });
  });

  it("skips API calls for non-dirty rows and redirects successfully", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: false,
    } as any);
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-uuid-1",
        fullName: "Existing Passenger",
        dateOfBirth: "1995-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
      },
    ]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Passenger")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Lưu thông tin hành khách"));

    await waitFor(() => {
      // Should not call create or update
      expect(createParticipantMock).not.toHaveBeenCalled();
      expect(updateParticipantMock).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/bookings/bk-123#visa");
    });
  });

  it("submits create/update requests for dirty/new rows only", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 2,
      children: 0,
      infants: 0,
      isVisaRequired: false,
    } as any);
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-uuid-1",
        fullName: "Existing Passenger",
        dateOfBirth: "1995-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
      },
    ]);

    const { container } = render(<CustomerAddParticipants bookingId="bk-123" />);

    // Wait for guest cards to load (Guest 1 is existing, Guest 2 is new)
    await waitFor(() => {
      expect(screen.getByText("Guest 2")).toBeInTheDocument();
    });

    // Fill in Guest 2 (new card)
    const inputs = screen.getAllByPlaceholderText("As shown on passport");
    expect(inputs.length).toBe(2);
    
    // Change input for Guest 2
    fireEvent.change(inputs[1], { target: { value: "New Passenger Name" } });
    
    // Set date of birth for Guest 2
    const dobInputs = container.querySelectorAll("input[type='date']");
    expect(dobInputs.length).toBe(2);
    fireEvent.change(dobInputs[1], { target: { value: "1998-10-20" } });

    createParticipantMock.mockResolvedValue("p-uuid-2");

    fireEvent.click(screen.getByText("Lưu thông tin hành khách"));

    await waitFor(() => {
      // Should call create for the new passenger, but not update for the existing one
      expect(createParticipantMock).toHaveBeenCalledTimes(1);
      expect(createParticipantMock).toHaveBeenCalledWith("bk-123", expect.objectContaining({
        fullName: "New Passenger Name",
        participantType: "Adult",
      }));
      expect(updateParticipantMock).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/bookings/bk-123#visa");
    });
  });

  it("handles individual row failure, displays error details and renders retry button", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: false,
    } as any);
    getParticipantsMock.mockResolvedValue([]);

    const { container } = render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    // Fill in Guest 1
    const nameInput = screen.getByPlaceholderText("As shown on passport");
    fireEvent.change(nameInput, { target: { value: "Fail Passenger" } });
    
    const dobInput = container.querySelector("input[type='date']");
    expect(dobInput).not.toBeNull();
    fireEvent.change(dobInput!, { target: { value: "1990-01-01" } });

    // Mock API to fail
    const apiError = new Error("Seat capacity race conflict");
    createParticipantMock.mockRejectedValue(apiError);

    fireEvent.click(screen.getByText("Lưu thông tin hành khách"));

    await waitFor(() => {
      expect(screen.getByText("Lưu thất bại")).toBeInTheDocument();
      expect(screen.getByText("Chi tiết: Seat capacity race conflict")).toBeInTheDocument();
      expect(screen.getByText("Thử lại các dòng lỗi")).toBeInTheDocument();
    });

    // Retry should trigger handleSave again
    createParticipantMock.mockResolvedValue("p-uuid-1");
    fireEvent.click(screen.getByText("Thử lại các dòng lỗi"));

    await waitFor(() => {
      expect(screen.getByText("Đã lưu thành công")).toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith("/bookings/bk-123#visa");
    });
  });

  it("synchronizes nationality and passport nationality bidirectionally, handles override", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: true,
    } as any);
    getParticipantsMock.mockResolvedValue([]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    // Wait for Guest cards to render
    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    // Select "Đã có visa" to reveal the passport fields
    fireEvent.click(screen.getByText("Đã có visa"));

    // Wait for passport fields to render
    await waitFor(() => {
      expect(screen.getByPlaceholderText("VN, US, JP...")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("VN")).toBeInTheDocument();
    });

    const guestNatInput = screen.getByPlaceholderText("VN, US, JP...");
    const passportNatInput = screen.getByPlaceholderText("VN");
    const overrideCheckbox = screen.getByLabelText("Hộ chiếu cấp ở quốc gia khác với quốc tịch hiện tại");

    expect(guestNatInput).toHaveValue("VN");
    expect(passportNatInput).toHaveValue("VN");
    expect(overrideCheckbox).not.toBeChecked();

    // 1. Changing guest nationality -> passport nationality auto syncs
    fireEvent.change(guestNatInput, { target: { value: "US" } });
    expect(guestNatInput).toHaveValue("US");
    expect(passportNatInput).toHaveValue("US");

    // 2. Changing passport nationality -> guest nationality auto syncs
    fireEvent.change(passportNatInput, { target: { value: "JP" } });
    expect(guestNatInput).toHaveValue("JP");
    expect(passportNatInput).toHaveValue("JP");

    // 3. Tick override checkbox -> sync breaks
    fireEvent.click(overrideCheckbox);
    expect(overrideCheckbox).toBeChecked();

    // Change guest nationality -> passport nationality should NOT change
    fireEvent.change(guestNatInput, { target: { value: "FR" } });
    expect(guestNatInput).toHaveValue("FR");
    expect(passportNatInput).toHaveValue("JP");

    // 4. Untick override checkbox -> resumes sync, passport nationality resets to match guest nationality
    fireEvent.click(overrideCheckbox);
    expect(overrideCheckbox).not.toBeChecked();
    expect(passportNatInput).toHaveValue("FR");
  });

  it("detects initial override state correctly when loading existing participants", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 2,
      children: 0,
      infants: 0,
      isVisaRequired: true,
    } as any);
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-uuid-1",
        fullName: "Guest One Same Nat",
        dateOfBirth: "1995-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
        passport: {
          passportNumber: "P001",
          nationality: "VN",
        },
      },
      {
        participantId: "p-uuid-2",
        fullName: "Guest Two Diff Nat",
        dateOfBirth: "1998-10-20",
        gender: 1,
        nationality: "VN",
        participantType: "Adult",
        passport: {
          passportNumber: "P002",
          nationality: "US",
        },
      },
    ]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
      expect(screen.getByText("Guest 2")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByLabelText("Hộ chiếu cấp ở quốc gia khác với quốc tịch hiện tại");
    expect(checkboxes.length).toBe(2);

    // Guest 1: nationality VN, passport nationality VN -> override unchecked
    expect(checkboxes[0]).not.toBeChecked();

    // Guest 2: nationality VN, passport nationality US -> override checked
    expect(checkboxes[1]).toBeChecked();
  });

  it("pre-fills booker fullName to participant 1 when no existing participants exist", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 2,
      children: 0,
      infants: 0,
      isVisaRequired: false,
      customerName: "Nguyễn Văn A",
    } as any);
    getParticipantsMock.mockResolvedValue([]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    // Wait for blank cards to render
    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
      expect(screen.getByText("Guest 2")).toBeInTheDocument();
    });

    const nameInputs = screen.getAllByPlaceholderText("As shown on passport");
    expect(nameInputs.length).toBe(2);

    // Participant 1 (Guest 1) should be pre-filled with Nguyễn Văn A
    expect(nameInputs[0]).toHaveValue("Nguyễn Văn A");
    expect(screen.getByText("Tự điền từ thông tin đặt — chỉnh nếu khách khác.")).toBeInTheDocument();

    // Participant 2 should be empty
    expect(nameInputs[1]).toHaveValue("");
  });

  it("does not pre-fill booker fullName if existing participants already exist", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: false,
      customerName: "Nguyễn Văn A",
    } as any);
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-uuid-1",
        fullName: "Existing Guest Name",
        dateOfBirth: "1995-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
      },
    ]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("As shown on passport");
    // Should NOT pre-fill since it is an existing participant
    expect(nameInput).toHaveValue("Existing Guest Name");
    expect(screen.queryByText("Tự điền từ thông tin đặt — chỉnh nếu khách khác.")).not.toBeInTheDocument();
  });
});
