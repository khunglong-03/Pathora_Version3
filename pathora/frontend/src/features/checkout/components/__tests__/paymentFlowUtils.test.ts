import { describe, expect, it } from "vitest";

import {
  isCancelReturn,
  mapTransactionStatusToNormalized,
  resolveReturnTransactionCode,
  shouldRedirectToHostedCheckout,
} from "../paymentFlowUtils";

const buildSearchParamsReader = (params: Record<string, string | undefined>) => ({
  get: (key: string) => params[key] ?? null,
});

describe("paymentFlowUtils", () => {
  describe("mapTransactionStatusToNormalized", () => {
    it("maps completed transaction to paid", () => {
      expect(mapTransactionStatusToNormalized("Completed")).toBe("paid");
    });

    it("maps cancelled transaction to cancelled", () => {
      expect(mapTransactionStatusToNormalized("Cancelled")).toBe("cancelled");
    });

    it("maps failed transaction with EXPIRED error to expired", () => {
      expect(mapTransactionStatusToNormalized("Failed", "EXPIRED")).toBe("expired");
    });

    it("maps failed transaction without EXPIRED error to failed", () => {
      expect(mapTransactionStatusToNormalized("Failed")).toBe("failed");
      expect(mapTransactionStatusToNormalized("Failed", "OTHER_ERROR")).toBe("failed");
    });

    it("maps failed transaction with lowercase expired error to expired", () => {
      expect(mapTransactionStatusToNormalized("Failed", "expired")).toBe("expired");
    });

    it("maps undefined status to pending", () => {
      expect(mapTransactionStatusToNormalized(undefined)).toBe("pending");
    });

    it("maps Processing status to pending", () => {
      expect(mapTransactionStatusToNormalized("Processing")).toBe("pending");
    });

    it("maps Refunded status to pending (non-terminal in current logic)", () => {
      expect(mapTransactionStatusToNormalized("Refunded")).toBe("pending");
    });
  });

  describe("resolveReturnTransactionCode", () => {
    it("resolves transactionCode from callback query params", () => {
      const reader = buildSearchParamsReader({
        transactionCode: "tx-123",
        code: "code-456",
        orderCode: "order-789",
      });

      expect(resolveReturnTransactionCode(reader)).toBe("tx-123");
    });

    it("falls back to code if transactionCode is null", () => {
      const reader = buildSearchParamsReader({
        transactionCode: null,
        code: "code-456",
        orderCode: "order-789",
      });

      expect(resolveReturnTransactionCode(reader)).toBe("code-456");
    });

    it("falls back to orderCode if transactionCode and code are null", () => {
      const reader = buildSearchParamsReader({
        transactionCode: null,
        code: null,
        orderCode: "order-789",
      });

      expect(resolveReturnTransactionCode(reader)).toBe("order-789");
    });

    it("returns null if all params are null", () => {
      const reader = buildSearchParamsReader({
        transactionCode: null,
        code: null,
        orderCode: null,
      });

      expect(resolveReturnTransactionCode(reader)).toBe(null);
    });

    it("trims whitespace from transaction code", () => {
      const reader = buildSearchParamsReader({
        transactionCode: "  tx-123  ",
      });

      expect(resolveReturnTransactionCode(reader)).toBe("tx-123");
    });

    it("returns null if transactionCode is empty string", () => {
      const reader = buildSearchParamsReader({
        transactionCode: "",
        code: "code-456",
      });

      expect(resolveReturnTransactionCode(reader)).toBe("code-456");
    });
  });

  describe("isCancelReturn", () => {
    it("detects cancelled callback via cancel=true flag", () => {
      const reader = buildSearchParamsReader({ cancel: "true" });
      expect(isCancelReturn(reader)).toBe(true);
    });

    it("detects cancelled callback via cancel=TRUE (uppercase)", () => {
      const reader = buildSearchParamsReader({ cancel: "TRUE" });
      expect(isCancelReturn(reader)).toBe(true);
    });

    it("detects cancelled callback via status=cancel", () => {
      const reader = buildSearchParamsReader({ status: "cancel" });
      expect(isCancelReturn(reader)).toBe(true);
    });

    it("detects cancelled callback via status=cancelled", () => {
      const reader = buildSearchParamsReader({ status: "cancelled" });
      expect(isCancelReturn(reader)).toBe(true);
    });

    it("detects cancelled callback via status=canceled (US spelling)", () => {
      const reader = buildSearchParamsReader({ status: "canceled" });
      expect(isCancelReturn(reader)).toBe(true);
    });

    it("detects cancelled callback via paymentStatus=cancelled", () => {
      const reader = buildSearchParamsReader({ paymentStatus: "cancelled" });
      expect(isCancelReturn(reader)).toBe(true);
    });

    it("returns false when no cancel indicators present", () => {
      const reader = buildSearchParamsReader({ status: "success" });
      expect(isCancelReturn(reader)).toBe(false);
    });

    it("handles mixed case status (converted to lowercase before compare)", () => {
      const reader = buildSearchParamsReader({ status: "CANCELLED" });
      expect(isCancelReturn(reader)).toBe(true); // Implementation uses .toLowerCase()
    });
  });

  describe("shouldRedirectToHostedCheckout", () => {
    // PayOS removed — no hosted checkout, always returns false
    it("always returns false since PayOS is removed", () => {
      expect(shouldRedirectToHostedCheckout("https://my.payos.vn/login")).toBe(false);
      expect(shouldRedirectToHostedCheckout("https://payos.vn/checkout")).toBe(false);
      expect(shouldRedirectToHostedCheckout("https://example.com/payment")).toBe(false);
      expect(shouldRedirectToHostedCheckout("https://vnpay.vn/pay")).toBe(false);
      expect(shouldRedirectToHostedCheckout("https://my.payos.vn/login?redirect=/")).toBe(false);
    });

    it("returns false for undefined input", () => {
      expect(shouldRedirectToHostedCheckout(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(shouldRedirectToHostedCheckout("")).toBe(false);
    });
  });
});
