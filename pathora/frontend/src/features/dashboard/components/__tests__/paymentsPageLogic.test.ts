import { describe, expect, it } from "vitest";

import type { AdminPayment } from "@/types/admin";
import { buildPaymentRowKeys } from "../paymentsPageLogic";

const createPayment = (overrides: Partial<AdminPayment> = {}): AdminPayment => {
  return {
    id: "PAY-001",
    booking: "Japan Sakura Tour",
    customer: "Nguyen Van A",
    method: "QR Code",
    amount: 3200,
    status: "completed",
    date: "Mar 10, 2026",
    ...overrides,
  };
};

describe("paymentsPageLogic", () => {
  it("preserves payment id as row key when ids are unique", () => {
    const payments = [
      createPayment({ id: "PAY-001" }),
      createPayment({ id: "PAY-002" }),
    ];

    expect(buildPaymentRowKeys(payments)).toEqual([
      "PAY-001",
      "PAY-002",
    ]);
  });

  it("creates unique row keys when payment ids collide", () => {
    const duplicateId = "PAY-019528C0";
    const payments = [
      createPayment({
        id: duplicateId,
        booking: "Japan Sakura Tour",
        amount: 3200,
        date: "Mar 10, 2026",
      }),
      createPayment({
        id: duplicateId,
        booking: "Korea Autumn Adventure",
        amount: 2100,
        date: "Mar 09, 2026",
      }),
      createPayment({
        id: duplicateId,
        booking: "Korea Autumn Adventure",
        amount: 2100,
        date: "Mar 09, 2026",
      }),
    ];

    const keys = buildPaymentRowKeys(payments);

    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(3);
    expect(keys.every((key) => key.startsWith(duplicateId))).toBe(true);
  });
});
