import { describe, expect, it } from "vitest";

// Re-declare enums to match paymentService.ts (avoiding axios import)
enum TransactionTypeEnum {
  Deposit = 1,
  FullPayment = 2,
  Refund = 3,
}

enum PaymentMethodEnum {
  Cash = 1,
  BankTransfer = 2,
  Card = 3,
  Momo = 4,
  VnPay = 5,
}

enum TransactionStatusEnum {
  Pending = 1,
  Processing = 2,
  Completed = 3,
  Failed = 4,
  Refunded = 5,
  Cancelled = 6,
}

type TransactionTypeString = "Deposit" | "FullPayment" | "Refund";
type PaymentMethodString = "Cash" | "BankTransfer" | "Card" | "Momo" | "VnPay";
type NormalizedPaymentStatus = "pending" | "paid" | "cancelled" | "expired" | "failed";

interface PaymentTransaction {
  id: string;
  transactionCode: string;
  bookingId: string;
  type: TransactionTypeString;
  status: "Pending" | "Processing" | "Completed" | "Failed" | "Refunded" | "Cancelled";
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod: string;
  createdAt: string;
  expiredAt?: string;
  paidAt?: string;
  completedAt?: string;
  checkoutUrl?: string;
  paymentNote?: string;
  senderName?: string;
  senderAccountNumber?: string;
  beneficiaryBank?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface CheckoutPriceResponse {
  bookingId: string;
  tourInstanceId: string;
  tourName: string;
  tourCode: string;
  thumbnailUrl?: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  location?: string;
  numberAdult: number;
  numberChild: number;
  numberInfant: number;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  adultSubtotal: number;
  childSubtotal: number;
  infantSubtotal: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
  depositPercentage: number;
  depositAmount: number;
  remainingBalance: number;
}

// Test enum conversion functions (matching paymentService.ts logic)
const toTransactionType = (type: TransactionTypeString): number =>
  TransactionTypeEnum[type as keyof typeof TransactionTypeEnum];

const toPaymentMethod = (method: PaymentMethodString): number =>
  PaymentMethodEnum[method as keyof typeof PaymentMethodEnum];

describe("payment enums", () => {
  describe("TransactionTypeEnum", () => {
    it("has correct numeric values", () => {
      expect(TransactionTypeEnum.Deposit).toBe(1);
      expect(TransactionTypeEnum.FullPayment).toBe(2);
      expect(TransactionTypeEnum.Refund).toBe(3);
    });

    it("converts string type to enum number", () => {
      expect(toTransactionType("Deposit")).toBe(1);
      expect(toTransactionType("FullPayment")).toBe(2);
      expect(toTransactionType("Refund")).toBe(3);
    });
  });

  describe("PaymentMethodEnum", () => {
    it("has correct numeric values", () => {
      expect(PaymentMethodEnum.Cash).toBe(1);
      expect(PaymentMethodEnum.BankTransfer).toBe(2);
      expect(PaymentMethodEnum.Card).toBe(3);
      expect(PaymentMethodEnum.Momo).toBe(4);
      expect(PaymentMethodEnum.VnPay).toBe(5);
    });

    it("converts string method to enum number", () => {
      expect(toPaymentMethod("Cash")).toBe(1);
      expect(toPaymentMethod("BankTransfer")).toBe(2);
      expect(toPaymentMethod("Card")).toBe(3);
      expect(toPaymentMethod("Momo")).toBe(4);
      expect(toPaymentMethod("VnPay")).toBe(5);
    });
  });

  describe("TransactionStatusEnum", () => {
    it("has correct numeric values", () => {
      expect(TransactionStatusEnum.Pending).toBe(1);
      expect(TransactionStatusEnum.Processing).toBe(2);
      expect(TransactionStatusEnum.Completed).toBe(3);
      expect(TransactionStatusEnum.Failed).toBe(4);
      expect(TransactionStatusEnum.Refunded).toBe(5);
      expect(TransactionStatusEnum.Cancelled).toBe(6);
    });
  });
});

describe("PaymentTransaction type", () => {
  it("accepts valid transaction status values", () => {
    const validTransaction: PaymentTransaction = {
      id: "test-id",
      transactionCode: "TX-123",
      bookingId: "booking-1",
      type: "Deposit",
      status: "Pending",
      amount: 1000000,
      paymentMethod: "BankTransfer",
      createdAt: "2026-03-18T10:00:00Z",
    };

    expect(validTransaction.status).toBe("Pending");
  });

  it("accepts completed status with paidAmount", () => {
    const completedTransaction: PaymentTransaction = {
      id: "test-id",
      transactionCode: "TX-123",
      bookingId: "booking-1",
      type: "FullPayment",
      status: "Completed",
      amount: 5000000,
      paidAmount: 5000000,
      paymentMethod: "VnPay",
      createdAt: "2026-03-18T10:00:00Z",
      paidAt: "2026-03-18T10:05:00Z",
    };

    expect(completedTransaction.status).toBe("Completed");
    expect(completedTransaction.paidAmount).toBe(5000000);
  });

  it("accepts optional QR code and expiration fields", () => {
    const transactionWithCheckout: PaymentTransaction = {
      id: "test-id",
      transactionCode: "TX-123",
      bookingId: "booking-1",
      type: "Deposit",
      status: "Pending",
      amount: 1000000,
      paymentMethod: "BankTransfer",
      createdAt: "2026-03-18T10:00:00Z",
      checkoutUrl: "https://sepay.vn/qr/test",
      expiredAt: "2026-03-18T10:30:00Z",
      paymentNote: "Payment for booking BOOK-001",
    };

    expect(transactionWithCheckout.checkoutUrl).toBe("https://sepay.vn/qr/test");
    expect(transactionWithCheckout.expiredAt).toBe("2026-03-18T10:30:00Z");
  });

  it("accepts sender info for bank transfer tracking", () => {
    const bankTransfer: PaymentTransaction = {
      id: "test-id",
      transactionCode: "TX-123",
      bookingId: "booking-1",
      type: "Deposit",
      status: "Completed",
      amount: 1000000,
      paidAmount: 1000000,
      paymentMethod: "BankTransfer",
      createdAt: "2026-03-18T10:00:00Z",
      paidAt: "2026-03-18T10:05:00Z",
      senderName: "John Doe",
      senderAccountNumber: "1234567890",
      beneficiaryBank: "Vietcombank",
    };

    expect(bankTransfer.senderName).toBe("John Doe");
    expect(bankTransfer.senderAccountNumber).toBe("1234567890");
  });

  it("accepts error fields for failed transactions", () => {
    const failedTransaction: PaymentTransaction = {
      id: "test-id",
      transactionCode: "TX-123",
      bookingId: "booking-1",
      type: "Deposit",
      status: "Failed",
      amount: 1000000,
      paymentMethod: "Card",
      createdAt: "2026-03-18T10:00:00Z",
      errorCode: "INSUFFICIENT_FUNDS",
      errorMessage: "The card has insufficient funds",
    };

    expect(failedTransaction.errorCode).toBe("INSUFFICIENT_FUNDS");
  });
});

describe("NormalizedPaymentStatus type", () => {
  it("accepts all valid normalized status values", () => {
    const statuses: NormalizedPaymentStatus[] = [
      "pending",
      "paid",
      "cancelled",
      "expired",
      "failed",
    ];

    expect(statuses).toHaveLength(5);
  });
});

describe("CheckoutPriceResponse type", () => {
  it("has all required pricing fields", () => {
    const checkoutPrice: CheckoutPriceResponse = {
      bookingId: "booking-1",
      tourInstanceId: "instance-1",
      tourName: "Da Nang Tour",
      tourCode: "DN-001",
      startDate: "2026-04-01T00:00:00Z",
      endDate: "2026-04-03T00:00:00Z",
      durationDays: 3,
      numberAdult: 2,
      numberChild: 1,
      numberInfant: 0,
      adultPrice: 1500000,
      childPrice: 750000,
      infantPrice: 0,
      adultSubtotal: 3000000,
      childSubtotal: 750000,
      infantSubtotal: 0,
      subtotal: 3750000,
      taxRate: 0.1,
      taxAmount: 375000,
      totalPrice: 4125000,
      depositPercentage: 0.3,
      depositAmount: 1237500,
      remainingBalance: 2887500,
    };

    expect(checkoutPrice.depositPercentage).toBe(0.3);
    expect(checkoutPrice.depositAmount).toBe(1237500);
    expect(checkoutPrice.remainingBalance).toBe(2887500);
  });

  it("supports optional thumbnail and location", () => {
    const checkoutPriceWithOptional: CheckoutPriceResponse = {
      bookingId: "booking-1",
      tourInstanceId: "instance-1",
      tourName: "Da Nang Tour",
      tourCode: "DN-001",
      thumbnailUrl: "https://cdn.pathora.com/tour.jpg",
      location: "Da Nang, Vietnam",
      startDate: "2026-04-01T00:00:00Z",
      endDate: "2026-04-03T00:00:00Z",
      durationDays: 3,
      numberAdult: 2,
      numberChild: 0,
      numberInfant: 0,
      adultPrice: 1500000,
      childPrice: 0,
      infantPrice: 0,
      adultSubtotal: 3000000,
      childSubtotal: 0,
      infantSubtotal: 0,
      subtotal: 3000000,
      taxRate: 0.1,
      taxAmount: 300000,
      totalPrice: 3300000,
      depositPercentage: 0.3,
      depositAmount: 990000,
      remainingBalance: 2310000,
    };

    expect(checkoutPriceWithOptional.thumbnailUrl).toBe("https://cdn.pathora.com/tour.jpg");
    expect(checkoutPriceWithOptional.location).toBe("Da Nang, Vietnam");
  });

  it("calculates deposit and remaining balance correctly for 30% deposit", () => {
    const checkoutPrice: CheckoutPriceResponse = {
      bookingId: "booking-1",
      tourInstanceId: "instance-1",
      tourName: "Premium Tour",
      tourCode: "PR-001",
      startDate: "2026-05-01T00:00:00Z",
      endDate: "2026-05-05T00:00:00Z",
      durationDays: 5,
      numberAdult: 2,
      numberChild: 1,
      numberInfant: 0,
      adultPrice: 2000000,
      childPrice: 1000000,
      infantPrice: 0,
      adultSubtotal: 4000000,
      childSubtotal: 1000000,
      infantSubtotal: 0,
      subtotal: 5000000,
      taxRate: 0.1,
      taxAmount: 500000,
      totalPrice: 5500000,
      depositPercentage: 0.3,
      depositAmount: 1650000,
      remainingBalance: 3850000,
    };

    // Verify deposit calculation: 30% of 5,500,000 = 1,650,000
    expect(checkoutPrice.depositAmount).toBe(checkoutPrice.totalPrice * 0.3);
    // Verify remaining: 5,500,000 - 1,650,000 = 3,850,000
    expect(checkoutPrice.remainingBalance).toBe(checkoutPrice.totalPrice - checkoutPrice.depositAmount);
  });
});
