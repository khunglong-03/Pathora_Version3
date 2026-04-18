import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import {
  paymentService,
  type CheckoutPriceResponse,
  type CreateTransactionPayload,
  type PaymentStatusSnapshot,
  type PaymentTransaction,
} from "../paymentService";

vi.mock("@/api/axiosInstance", () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe("paymentService contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates SePay transaction with numeric enums for backend API", async () => {
    const payload: CreateTransactionPayload = {
      bookingId: "booking-001",
      type: "FullPayment",
      amount: 1500000,
      paymentMethod: "BankTransfer",
      paymentNote: "PAY-001",
      createdBy: "student@pathora.vn",
      expirationMinutes: 30,
      paymentGateway: "Sepay",
    };

    const transaction: PaymentTransaction = {
      id: "tx-001",
      transactionCode: "PAY-001",
      bookingId: "booking-001",
      type: "FullPayment",
      status: "Pending",
      amount: 1500000,
      paymentMethod: "BankTransfer",
      createdAt: "2026-04-19T10:00:00Z",
      checkoutUrl: "https://qr.sepay.vn/img",
      managerBankCode: "MB",
      managerAccountNumber: "0868430273",
      managerAccountName: "PATHORA",
    };

    vi.mocked(api.post).mockResolvedValue({
      data: { result: transaction },
    } as never);

    const result = await paymentService.createTransaction(payload);

    expect(result).toEqual(transaction);
    expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.PAYMENT.CREATE_TRANSACTION, {
      ...payload,
      type: 2,
      paymentMethod: 2,
    });
  });

  it("loads transaction details from payment endpoint", async () => {
    const transaction: PaymentTransaction = {
      id: "tx-002",
      transactionCode: "PAY-002",
      bookingId: "booking-002",
      type: "Deposit",
      status: "Completed",
      amount: 900000,
      paidAmount: 900000,
      paymentMethod: "BankTransfer",
      createdAt: "2026-04-19T10:00:00Z",
      paidAt: "2026-04-19T10:05:00Z",
      beneficiaryBank: "MBBank",
      senderName: "Nguyen Van A",
      senderAccountNumber: "0123456789",
    };

    vi.mocked(api.get).mockResolvedValue({
      data: { data: transaction },
    } as never);

    const result = await paymentService.getTransaction("PAY-002");

    expect(result).toEqual(transaction);
    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PAYMENT.GET_TRANSACTION("PAY-002"));
  });

  it("checks payment status through reconciliation check endpoint", async () => {
    const snapshot: PaymentStatusSnapshot = {
      transactionCode: "PAY-003",
      normalizedStatus: "paid",
      rawStatus: "Completed",
      source: "sepay-webhook",
      verifiedWithProvider: true,
      isTerminal: true,
      checkedAt: "2026-04-19T10:05:00Z",
      providerTransactionId: "sepay-003",
    };

    vi.mocked(api.get).mockResolvedValue({
      data: { result: snapshot },
    } as never);

    const result = await paymentService.checkPayment("PAY-003");

    expect(result).toEqual(snapshot);
    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PAYMENT.CHECK_PAYMENT("PAY-003"));
  });

  it("gets normalized status from status endpoint", async () => {
    const snapshot: PaymentStatusSnapshot = {
      transactionCode: "PAY-004",
      normalizedStatus: "pending",
      rawStatus: "Processing",
      source: "status-check",
      verifiedWithProvider: false,
      isTerminal: false,
      checkedAt: "2026-04-19T10:02:00Z",
    };

    vi.mocked(api.get).mockResolvedValue({
      data: { result: snapshot },
    } as never);

    const result = await paymentService.getNormalizedStatus("PAY-004");

    expect(result).toEqual(snapshot);
    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PAYMENT.GET_TRANSACTION_STATUS("PAY-004"));
  });

  it("reconciles return callback with transactionCode query parameter", async () => {
    const snapshot: PaymentStatusSnapshot = {
      transactionCode: "PAY-005",
      normalizedStatus: "paid",
      rawStatus: "Completed",
      source: "return",
      verifiedWithProvider: true,
      isTerminal: true,
      checkedAt: "2026-04-19T10:05:00Z",
    };

    vi.mocked(api.get).mockResolvedValue({
      data: { result: snapshot },
    } as never);

    const result = await paymentService.reconcileReturn("PAY-005");

    expect(result).toEqual(snapshot);
    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PAYMENT.RECONCILE_RETURN, {
      params: { transactionCode: "PAY-005" },
    });
  });

  it("reconciles cancel callback with transactionCode query parameter", async () => {
    const snapshot: PaymentStatusSnapshot = {
      transactionCode: "PAY-006",
      normalizedStatus: "cancelled",
      rawStatus: "Cancelled",
      source: "cancel",
      verifiedWithProvider: false,
      isTerminal: true,
      checkedAt: "2026-04-19T10:07:00Z",
    };

    vi.mocked(api.get).mockResolvedValue({
      data: { result: snapshot },
    } as never);

    const result = await paymentService.reconcileCancel("PAY-006");

    expect(result).toEqual(snapshot);
    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PAYMENT.RECONCILE_CANCEL, {
      params: { transactionCode: "PAY-006" },
    });
  });

  it("expires transaction using transaction-specific endpoint", async () => {
    const transaction: PaymentTransaction = {
      id: "tx-007",
      transactionCode: "PAY-007",
      bookingId: "booking-007",
      type: "Deposit",
      status: "Cancelled",
      amount: 500000,
      paymentMethod: "BankTransfer",
      createdAt: "2026-04-19T10:00:00Z",
      errorCode: "EXPIRED",
      errorMessage: "Payment transaction has expired",
    };

    vi.mocked(api.post).mockResolvedValue({
      data: { result: transaction },
    } as never);

    const result = await paymentService.expireTransaction("PAY-007");

    expect(result).toEqual(transaction);
    expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.PAYMENT.EXPIRE_TRANSACTION("PAY-007"));
  });

  it("loads checkout pricing breakdown for payment page", async () => {
    const checkoutPrice: CheckoutPriceResponse = {
      bookingId: "booking-008",
      tourInstanceId: "instance-008",
      tourName: "Ha Long Premium",
      tourCode: "HL-008",
      thumbnailUrl: "https://cdn.pathora.vn/tours/ha-long.jpg",
      startDate: "2026-05-01T00:00:00Z",
      endDate: "2026-05-03T00:00:00Z",
      durationDays: 3,
      location: "Ha Long",
      numberAdult: 2,
      numberChild: 1,
      numberInfant: 0,
      adultPrice: 1800000,
      childPrice: 1200000,
      infantPrice: 0,
      adultSubtotal: 3600000,
      childSubtotal: 1200000,
      infantSubtotal: 0,
      subtotal: 4800000,
      taxRate: 0.1,
      taxAmount: 480000,
      totalPrice: 5280000,
      depositPercentage: 0.3,
      depositAmount: 1584000,
      remainingBalance: 3696000,
    };

    vi.mocked(api.get).mockResolvedValue({
      data: { result: checkoutPrice },
    } as never);

    const result = await paymentService.getCheckoutPrice("booking-008");

    expect(result).toEqual(checkoutPrice);
    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.BOOKING.GET_CHECKOUT_PRICE("booking-008"));
  });
});
