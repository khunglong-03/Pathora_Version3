import type { AdminVisaApplication } from "@/types/admin";

const buildVisaFingerprint = (visa: AdminVisaApplication): string => {
  return [
    visa.id,
    visa.booking,
    visa.applicant,
    visa.passport,
    visa.country,
    visa.type,
    visa.status,
    visa.submittedDate,
    visa.decisionDate,
  ].join("|");
};

export const buildVisaRowKeys = (
  visaApplications: AdminVisaApplication[],
): string[] => {
  const idCounts = new Map<string, number>();

  visaApplications.forEach((visa, index) => {
    const visaId = visa.id || `UNKNOWN-VISA-${index + 1}`;
    idCounts.set(visaId, (idCounts.get(visaId) ?? 0) + 1);
  });

  const duplicateFingerprintCounts = new Map<string, number>();

  return visaApplications.map((visa, index) => {
    const visaId = visa.id || `UNKNOWN-VISA-${index + 1}`;
    const idCount = idCounts.get(visaId) ?? 0;

    if (idCount <= 1) {
      return visaId;
    }

    const fingerprint = buildVisaFingerprint(visa);
    const duplicateCount = (duplicateFingerprintCounts.get(fingerprint) ?? 0) + 1;
    duplicateFingerprintCounts.set(fingerprint, duplicateCount);

    if (duplicateCount === 1) {
      return fingerprint;
    }

    return `${fingerprint}|${duplicateCount}`;
  });
};
