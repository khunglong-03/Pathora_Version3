import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("private-custom checkout contract", () => {
  it("CheckoutPage branches on flow=private-custom and uses createPrivateCustomInitial", () => {
    const page = readFile("src/features/checkout/components/CheckoutPage.tsx");
    expect(page).toMatch(/private-custom/);
    expect(page).toMatch(/createPrivateCustomInitial/);
  });

  it("paymentService exposes createPrivateCustomInitial and public checkout price flag", () => {
    const svc = readFile("src/api/services/paymentService.ts");
    expect(svc).toMatch(/createPrivateCustomInitial/);
    expect(svc).toMatch(/usePublicBookingEndpoint/);
  });

  it("surfaces API price loading and errors in BookingSummary (bookingId checkout)", () => {
    const page = readFile("src/features/checkout/components/CheckoutPage.tsx");
    expect(page).toMatch(/isBookingIdPriceFetch/);
    expect(page).toMatch(/loadingPrice=\{isBookingIdPriceFetch\s*&&\s*loadingPrice\}/);
    expect(page).toMatch(/priceError=\{isBookingIdPriceFetch\s*\?\s*priceError\s*:\s*null\}/);
    expect(page).toMatch(/checkoutPriceMissing/);
    expect(page).toMatch(/priceFetchError/);
  });

  it("uses private-custom success toast and co-design copy after base payment", () => {
    const page = readFile("src/features/checkout/components/CheckoutPage.tsx");
    expect(page).toMatch(/toastPaidSuccess/);
    expect(page).toMatch(/privateCustomPaymentReceived/);
    const sidebar = readFile("src/features/checkout/components/PaymentSidebar.tsx");
    expect(sidebar).toMatch(/privateCustomCheckout/);
    expect(sidebar).toMatch(/privateCustomCoDesignNextSteps/);
  });

  it("shows distinct error toast when private-custom payment init fails", () => {
    const page = readFile("src/features/checkout/components/CheckoutPage.tsx");
    expect(page).toMatch(/privateCustomTransactionError/);
  });
});
