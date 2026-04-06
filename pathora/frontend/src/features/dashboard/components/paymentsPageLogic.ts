import type { AdminPayment } from "@/types/admin";

const buildPaymentFingerprint = (payment: AdminPayment): string => {
  return [
    payment.id,
    payment.booking,
    payment.customer,
    payment.method,
    payment.amount,
    payment.status,
    payment.date,
  ].join("|");
};

export const buildPaymentRowKeys = (payments: AdminPayment[]): string[] => {
  const idCounts = new Map<string, number>();

  payments.forEach((payment, index) => {
    const paymentId = payment.id || `UNKNOWN-PAYMENT-${index + 1}`;
    idCounts.set(paymentId, (idCounts.get(paymentId) ?? 0) + 1);
  });

  const duplicateFingerprintCounts = new Map<string, number>();

  return payments.map((payment, index) => {
    const paymentId = payment.id || `UNKNOWN-PAYMENT-${index + 1}`;
    const idCount = idCounts.get(paymentId) ?? 0;

    if (idCount <= 1) {
      return paymentId;
    }

    const fingerprint = buildPaymentFingerprint(payment);
    const duplicateCount = (duplicateFingerprintCounts.get(fingerprint) ?? 0) + 1;
    duplicateFingerprintCounts.set(fingerprint, duplicateCount);

    if (duplicateCount === 1) {
      return fingerprint;
    }

    return `${fingerprint}|${duplicateCount}`;
  });
};
