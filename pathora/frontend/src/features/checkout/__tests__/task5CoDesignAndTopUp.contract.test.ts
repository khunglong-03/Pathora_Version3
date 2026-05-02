import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("task 5 — private co-design & top-up (contract)", () => {
  it("5.1–5.2 customer co-design: draft by day, comments, final price, loading/error", () => {
    const customer = readFile("src/features/private-co-design/PrivateTourCoDesignCustomerSection.tsx");
    expect(customer).toMatch(/data-testid="private-co-design-customer-section"/);
    expect(customer).toMatch(/data-day-tab=/);
    expect(customer).toMatch(/data-final-sell-price-display/);
    expect(customer).toMatch(/listItineraryFeedback/);
    expect(customer).toMatch(/data-loading-feedback/);
    expect(customer).toMatch(/data-feedback-error/);
    expect(customer).toMatch(/data-action="send-customer-feedback"/);
  });

  it("5.3–5.4 operator co-design: desktop drag/drop, mobile reorder, final price, reply", () => {
    const op = readFile("src/features/private-co-design/PrivateTourCoDesignOperatorSection.tsx");
    expect(op).toMatch(/data-testid="private-co-design-operator-section"/);
    expect(op).toMatch(/draggable/);
    expect(op).toMatch(/data-day-reorder-mobile=/);
    expect(op).toMatch(/data-operator-final-price-input/);
    expect(op).toMatch(/data-action="set-final-sell-price"/);
    expect(op).toMatch(/data-action="send-operator-reply"/);
    expect(op).toMatch(/moveIdx/);
  });

  it("5.5–5.6 top-up checkout: flow param, load transaction, delta copy, public booking price", () => {
    const page = readFile("src/features/checkout/components/CheckoutPage.tsx");
    expect(page).toMatch(/private-top-up/);
    expect(page).toMatch(/transactionCodeParam/);
    expect(page).toMatch(/getTransaction\(/);
    expect(page).toMatch(/privateTopUpTransactionLoadError/);
    expect(page).toMatch(/data-private-top-up-context/);
    expect(page).toMatch(/privateTopUpMissingParams/);
    expect(page).toMatch(/usePublicBookingCheckoutPrice/);
    const sidebar = readFile("src/features/checkout/components/PaymentSidebar.tsx");
    expect(sidebar).toMatch(/privateTopUpCheckout/);
    expect(sidebar).toMatch(/privateTopUpPayNote/);
    expect(sidebar).toMatch(/paymentExpired/);
    expect(sidebar).toMatch(/data-payment-provider-error/);
  });

  it("5.7–5.8 wallet credit banner from co-design query + i18n", () => {
    const coDesign = readFile("src/features/private-co-design/CoDesignPage.tsx");
    expect(coDesign).toMatch(/creditedAmount/);
    expect(coDesign).toMatch(/PrivateTourWalletCreditBanner/);
    const banner = readFile("src/features/private-co-design/PrivateTourWalletCreditBanner.tsx");
    expect(banner).toMatch(/data-testid="private-tour-wallet-credit-banner"/);
    const en = readFile("src/i18n/locales/en.json");
    expect(en).toMatch(/walletCreditBanner/);
  });
});
