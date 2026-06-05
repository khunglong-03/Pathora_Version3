import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerAddParticipants } from "../CustomerAddParticipants";
import { bookingService } from "@/api/services/bookingService";
import { fileService } from "@/api/services/fileService";
import { toast } from "react-toastify";

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("react-i18next", () => {
  const t = (_key: string, fallbackOrOptions?: any, options?: any) => {
    const opts = typeof fallbackOrOptions === "object" ? fallbackOrOptions : options;
    if (_key === "landing.bookings.addParticipantsPage.guestNumber" || _key === "landing.bookings.addParticipantsPage.guestNumberWithDesignated") {
      return `Guest ${opts?.index ?? 1}`;
    }
    return typeof fallbackOrOptions === "string" ? fallbackOrOptions : _key;
  };
  return {
    useTranslation: () => ({ t }),
    initReactI18next: {
      type: "3rdParty",
      init: () => {},
    },
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
    const selects = container.querySelectorAll("select");
    // selects[4] is Day, selects[5] is Month, selects[6] is Year for Guest 2
    fireEvent.change(selects[4], { target: { value: "20" } });
    fireEvent.change(selects[5], { target: { value: "10" } });
    fireEvent.change(selects[6], { target: { value: "1998" } });

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
    
    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[0], { target: { value: "01" } });
    fireEvent.change(selects[1], { target: { value: "01" } });
    fireEvent.change(selects[2], { target: { value: "1990" } });

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

    expect(guestNatInput).toHaveValue("VN");
    expect(passportNatInput).toHaveValue("VN");

    // 1. Changing guest nationality -> passport nationality should NOT change (independent)
    fireEvent.change(guestNatInput, { target: { value: "US" } });
    expect(guestNatInput).toHaveValue("US");
    expect(passportNatInput).toHaveValue("VN");

    // 2. Changing passport nationality -> guest nationality should NOT change (independent)
    fireEvent.change(passportNatInput, { target: { value: "JP" } });
    expect(guestNatInput).toHaveValue("US");
    expect(passportNatInput).toHaveValue("JP");
  });

  it("loads nationality and passport nationality correctly when they differ", async () => {
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

    const guestNatInputs = screen.getAllByPlaceholderText("VN, US, JP...");
    const passportNatInputs = screen.getAllByPlaceholderText("VN");

    expect(guestNatInputs[0]).toHaveValue("VN");
    expect(passportNatInputs[0]).toHaveValue("VN");

    expect(guestNatInputs[1]).toHaveValue("VN");
    expect(passportNatInputs[1]).toHaveValue("US");
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

  it("renders rejected warning banner with custom CTA buttons", async () => {
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
        fullName: "Nguyễn Văn A",
        dateOfBirth: "1990-01-01",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
        infoReviewStatus: "Rejected",
        infoRejectionReason: "Sai ngày sinh trên hộ chiếu",
      },
      {
        participantId: "p-uuid-2",
        fullName: "Nguyễn Văn B",
        dateOfBirth: "1995-05-05",
        gender: 1,
        nationality: "VN",
        participantType: "Adult",
        infoReviewStatus: "Approved",
      }
    ]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    // Check Rejected warning banner text and reasons
    expect(screen.getByText(/Sai ngày sinh trên hộ chiếu/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cập nhật thông tin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Liên hệ hotline/ })).toBeInTheDocument();
  });

  it("triggers edit warning confirmation modal when unlocking approved participant", async () => {
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
        fullName: "Nguyễn Văn A",
        dateOfBirth: "1990-01-01",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
        infoReviewStatus: "Approved",
      }
    ]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Thông tin đã được duyệt. Sửa đổi sẽ yêu cầu duyệt lại.")).toBeInTheDocument();

    const unlockBtn = screen.getByRole("button", { name: "Mở khóa chỉnh sửa" });
    expect(unlockBtn).toBeInTheDocument();

    // Click Mở khóa chỉnh sửa to trigger modal
    fireEvent.click(unlockBtn);

    expect(screen.getByText("Hành khách này đã được duyệt")).toBeInTheDocument();
    expect(screen.getByText("Chỉnh sửa sẽ huỷ trạng thái duyệt và phải chờ Tour Operator duyệt lại.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tiếp tục sửa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Huỷ bỏ" })).toBeInTheDocument();
  });

  it("renders passport preview image with correct URL and alt text", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: true,
    } as any);
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-uuid-1",
        fullName: "Test Passenger",
        dateOfBirth: "1995-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
        passport: {
          passportNumber: "P123",
          nationality: "VN",
          issuedAt: "2020-01-01",
          expiresAt: "2030-01-01",
          fileUrl: "https://example.com/passport.jpg",
        },
      },
    ]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    const passportImg = screen.getByAltText("Passport");
    expect(passportImg).toBeInTheDocument();
    expect(passportImg).toHaveAttribute("src", "https://example.com/passport.jpg");
  });

  it("renders visa preview image with correct URL and alt text after selecting visa status", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: true,
    } as any);
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-uuid-1",
        fullName: "Test Passenger",
        dateOfBirth: "1995-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
        visaApplications: [
          {
            destinationCountry: "JP",
            minReturnDate: "2026-07-01",
            visaFileUrl: "https://example.com/visa.jpg",
          }
        ]
      },
    ]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    // Click "Đã có visa" button to set visaMode = "has_visa"
    fireEvent.click(screen.getByText("Đã có visa"));

    const visaImg = screen.getByAltText("Visa");
    expect(visaImg).toBeInTheDocument();
    expect(visaImg).toHaveAttribute("src", "https://example.com/visa.jpg");
  });

  it("hides the image and shows the file error fallback when image load fails (onError)", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: true,
    } as any);
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-uuid-1",
        fullName: "Test Passenger",
        dateOfBirth: "1995-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
        passport: {
          passportNumber: "P123",
          nationality: "VN",
          issuedAt: "2020-01-01",
          expiresAt: "2030-01-01",
          fileUrl: "https://example.com/passport.jpg",
        },
      },
    ]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    const passportImg = screen.getByAltText("Passport");
    expect(passportImg).toBeInTheDocument();

    // Trigger onError event on the image
    fireEvent.error(passportImg);

    expect(passportImg).toHaveStyle({ display: "none" });
    const fallbackText = screen.getByText("Không load được ảnh");
    expect(fallbackText).toBeInTheDocument();
  });

  it("rejects files larger than 10MB and shows toast error", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: true,
    } as any);
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-uuid-1",
        fullName: "Test Passenger",
        dateOfBirth: "1995-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
        passport: {
          passportNumber: "P123",
          nationality: "VN",
          issuedAt: "2020-01-01",
          expiresAt: "2030-01-01",
          fileUrl: "",
        },
      },
    ]);

    const { container } = render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // Create file larger than 10MB
    const largeFile = new File(["dummy"], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(largeFile, "size", { value: 11 * 1024 * 1024 });

    fireEvent.change(fileInput!, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Ảnh quá lớn, vui lòng chọn file dưới 10MB");
      expect(vi.mocked(fileService.uploadFile)).not.toHaveBeenCalled();
    });
  });

  it("updates progress bar during upload and displays processing when upload is complete", async () => {
    getBookingDetailMock.mockResolvedValue({
      id: "bk-123",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: true,
    } as any);
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-uuid-1",
        fullName: "Test Passenger",
        dateOfBirth: "1995-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Adult",
        passport: {
          passportNumber: "P123",
          nationality: "VN",
          issuedAt: "2020-01-01",
          expiresAt: "2030-01-01",
          fileUrl: "",
        },
      },
    ]);

    let triggerProgress: ((percent: number) => void) | undefined;
    let resolveUpload: ((value: any) => void) | undefined;

    vi.mocked(fileService.uploadFile).mockImplementation((_file, options) => {
      triggerProgress = options?.onProgress;
      return new Promise((resolve) => {
        resolveUpload = resolve;
      });
    });

    const { container } = render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // Use a non-image file type to skip compressImage canvas flow in jsdom environment
    const testFile = new File(["dummy"], "passport.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput!, { target: { files: [testFile] } });

    // Wait for the mock to be called and capture progress trigger
    await waitFor(() => {
      expect(triggerProgress).toBeDefined();
    });

    // Simulate 50% progress
    act(() => {
      triggerProgress!(50);
    });
    await waitFor(() => {
      const progressBar = container.querySelector('.bg-slate-700');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    // Simulate 100% progress
    act(() => {
      triggerProgress!(100);
    });
    await waitFor(() => {
      const progressBar = container.querySelector('.bg-slate-700');
      expect(progressBar).toHaveStyle({ width: '100%' });
      expect(screen.getByText("Đang xử lý...")).toBeInTheDocument();
    });

    // Resolve upload response
    act(() => {
      resolveUpload!({ url: "https://example.com/new-passport.jpg" });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("landing.bookings.addParticipantsPage.savedSuccess");
    });
  });

  it("validates age mismatch between participantType and designatedType on save and marks card with error", async () => {
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
        fullName: "Child In Adult Seat",
        dateOfBirth: "2020-05-15",
        gender: 0,
        nationality: "VN",
        participantType: "Child",
        designatedType: "Adult",
      },
    ]);

    render(<CustomerAddParticipants bookingId="bk-123" />);

    await waitFor(() => {
      expect(screen.getByText("Guest 1")).toBeInTheDocument();
    });

    // Triggers mismatch validation on save
    const saveButton = screen.getByText("Lưu thông tin hành khách");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Có lỗi xảy ra khi lưu một số hành khách. Vui lòng kiểm tra lại.");
      expect(bookingService.updateParticipant).not.toHaveBeenCalled();
    });
  });

  describe("Assisted visa flow display", () => {
    const assistedParticipantBase = {
      participantId: "p-assisted-1",
      fullName: "Assisted Passenger",
      dateOfBirth: "1990-01-01",
      gender: 0,
      nationality: "VN",
      participantType: "Adult",
      passport: {
        passportId: "pass-1",
        passportNumber: null,
        nationality: "VN",
        issuedAt: null,
        expiresAt: null,
        fileUrl: "https://cdn/passport.jpg",
      },
    };

    const visaRequiredBooking = {
      id: "bk-visa",
      adults: 1,
      children: 0,
      infants: 0,
      isVisaRequired: true,
    };

    it("renders 'Đang chờ operator báo phí' for assisted participant with no service fee", async () => {
      getBookingDetailMock.mockResolvedValue(visaRequiredBooking as any);
      getParticipantsMock.mockResolvedValue([
        {
          ...assistedParticipantBase,
          visaApplications: [
            {
              visaApplicationId: "v-1",
              passportId: "pass-1",
              destinationCountry: null,
              status: "Pending",
              minReturnDate: null,
              visaFileUrl: null,
              isSystemAssisted: true,
              serviceFee: null,
              serviceFeePaidAt: null,
              visa: null,
            },
          ],
        },
      ]);

      render(<CustomerAddParticipants bookingId="bk-visa" />);

      await waitFor(() => {
        expect(screen.getByTestId("assisted-status-pending-fee")).toBeInTheDocument();
      });

      // Passport number/issued/expires inputs MUST NOT render in assisted mode
      expect(screen.queryByLabelText(/Passport Number/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Issued Date/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Expires Date/i)).not.toBeInTheDocument();
      // Visa file upload (has_visa flow) MUST NOT render in assisted mode
      expect(screen.queryByText("Ảnh File Visa (tùy chọn)")).not.toBeInTheDocument();
    });

    it("renders fee quoted panel with formatted amount when operator quoted fee", async () => {
      getBookingDetailMock.mockResolvedValue(visaRequiredBooking as any);
      getParticipantsMock.mockResolvedValue([
        {
          ...assistedParticipantBase,
          visaApplications: [
            {
              visaApplicationId: "v-2",
              passportId: "pass-1",
              destinationCountry: null,
              status: "Pending",
              minReturnDate: null,
              visaFileUrl: null,
              isSystemAssisted: true,
              serviceFee: 500000,
              serviceFeePaidAt: null,
              visa: null,
            },
          ],
        },
      ]);

      render(<CustomerAddParticipants bookingId="bk-visa" />);

      await waitFor(() => {
        expect(screen.getByTestId("assisted-status-fee-quoted")).toBeInTheDocument();
      });
      const payBtn = screen.getByTestId("assisted-status-fee-pay-action");
      expect(payBtn).toBeInTheDocument();
      fireEvent.click(payBtn);
      expect(toast.info).toHaveBeenCalledWith("Tính năng thanh toán phí dịch vụ sẽ sớm có. Vui lòng liên hệ operator để thanh toán.");
    });

    it("renders processing panel when fee paid but visa not yet issued", async () => {
      getBookingDetailMock.mockResolvedValue(visaRequiredBooking as any);
      getParticipantsMock.mockResolvedValue([
        {
          ...assistedParticipantBase,
          visaApplications: [
            {
              visaApplicationId: "v-3",
              passportId: "pass-1",
              destinationCountry: null,
              status: "Pending",
              minReturnDate: null,
              visaFileUrl: null,
              isSystemAssisted: true,
              serviceFee: 500000,
              serviceFeePaidAt: "2026-06-01T00:00:00Z",
              visa: null,
            },
          ],
        },
      ]);

      render(<CustomerAddParticipants bookingId="bk-visa" />);

      await waitFor(() => {
        expect(screen.getByTestId("assisted-status-processing")).toBeInTheDocument();
      });
    });

    it("renders Block 2 (visa mode selector) before Block 3 (passport block) in DOM order when both visible", async () => {
      getBookingDetailMock.mockResolvedValue(visaRequiredBooking as any);
      getParticipantsMock.mockResolvedValue([
        {
          ...assistedParticipantBase,
          visaApplications: [
            {
              visaApplicationId: "v-4",
              passportId: "pass-1",
              destinationCountry: null,
              status: "Pending",
              minReturnDate: null,
              visaFileUrl: null,
              isSystemAssisted: true,
              serviceFee: null,
              serviceFeePaidAt: null,
              visa: null,
            },
          ],
        },
      ]);

      render(<CustomerAddParticipants bookingId="bk-visa" />);

      await waitFor(() => {
        expect(screen.getByTestId("assisted-status-pending-fee")).toBeInTheDocument();
      });

      const selector = screen.getByTestId("visa-mode-selector-p-assisted-1");
      const block3 = screen.getByTestId("visa-passport-block-p-assisted-1");
      const order = selector.compareDocumentPosition(block3);
      expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});

