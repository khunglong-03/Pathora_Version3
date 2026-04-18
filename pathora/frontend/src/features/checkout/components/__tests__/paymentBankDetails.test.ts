import { describe, expect, it } from "vitest";

import { resolvePaymentBeneficiaryDetails } from "../paymentBankDetails";

describe("resolvePaymentBeneficiaryDetails", () => {
  it("prefers transaction-backed beneficiary fields", () => {
    const details = resolvePaymentBeneficiaryDetails({
      beneficiaryBank: "Vietcombank",
      managerBankCode: "VCB",
      managerAccountNumber: "0123456789",
      managerAccountName: "PATHORA TRAVEL",
    });

    expect(details.bankName).toBe("Vietcombank");
    expect(details.accountNumber).toBe("0123456789");
    expect(details.accountHolder).toBe("PATHORA TRAVEL");
  });

  it("falls back to manager bank code when beneficiary bank is missing", () => {
    const details = resolvePaymentBeneficiaryDetails({
      beneficiaryBank: "",
      managerBankCode: "MB",
      managerAccountNumber: "0987654321",
      managerAccountName: "PATHORA OPERATIONS",
    });

    expect(details.bankName).toBe("MB");
    expect(details.accountNumber).toBe("0987654321");
    expect(details.accountHolder).toBe("PATHORA OPERATIONS");
  });
});
