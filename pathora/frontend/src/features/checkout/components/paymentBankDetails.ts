import type { PaymentTransaction } from "@/api/services/paymentService";

export interface PaymentBeneficiaryDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

const DEFAULT_BANK_NAME = "MBBank (MB)";
const DEFAULT_ACCOUNT_NUMBER = "0378175727";
const DEFAULT_ACCOUNT_HOLDER = "PATHORA TRAVEL";

const firstNonEmpty = (...values: Array<string | undefined | null>) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();

export const resolvePaymentBeneficiaryDetails = (
  transaction: Pick<PaymentTransaction, "beneficiaryBank" | "managerBankCode" | "managerAccountNumber" | "managerAccountName"> | null | undefined,
): PaymentBeneficiaryDetails => {
  return {
    bankName: firstNonEmpty(
      transaction?.beneficiaryBank,
      transaction?.managerBankCode,
      process.env.NEXT_PUBLIC_BANK_NAME,
    ) ?? DEFAULT_BANK_NAME,
    accountNumber: firstNonEmpty(
      transaction?.managerAccountNumber,
      process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER,
    ) ?? DEFAULT_ACCOUNT_NUMBER,
    accountHolder: firstNonEmpty(
      transaction?.managerAccountName,
      process.env.NEXT_PUBLIC_BANK_ACCOUNT_HOLDER,
    ) ?? DEFAULT_ACCOUNT_HOLDER,
  };
};
