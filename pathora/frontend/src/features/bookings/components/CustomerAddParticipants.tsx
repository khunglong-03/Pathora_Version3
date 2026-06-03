"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, WarningCircle, CheckCircle, Spinner, IdentificationCard, HandHeart, Info, File, UploadSimple } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { bookingService } from "@/api/services/bookingService";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { fileService } from "@/api/services/fileService";

type VisaMode = "has_visa" | "needs_support" | "";

interface Participant {
  id: string;
  fullName: string;
  dob: string;
  gender: number;
  nationality: string;
  participantType: string;
  designatedType?: string;
  documentUploaded: boolean;
  hasVisaApp: boolean;
  isNew?: boolean;
  passportId?: string;

  // Visa intent for this participant
  visaMode: VisaMode;
  nationalityOverride: boolean;

  // Passport (used when visaMode === "has_visa")
  passportNumber: string;
  passportNationality: string;
  passportIssuedAt: string;
  passportExpiresAt: string;
  passportFileUrl: string;

  // Visa application (used when visaMode === "has_visa")
  destinationCountry: string;
  minReturnDate: string;
  visaFileUrl: string;

  // Review fields
  infoReviewStatus?: "NotReviewed" | "Approved" | "Rejected";
  infoRejectionReason?: string | null;
}

const getDestinationCountryIso = (location?: string): string => {
  if (!location) return "";
  const loc = location.toLowerCase();
  if (loc.includes("nhật") || loc.includes("japan") || loc.includes("tokyo") || loc.includes("osaka")) return "JP";
  if (loc.includes("hàn quốc") || loc.includes("korea") || loc.includes("seoul")) return "KR";
  if (loc.includes("mỹ") || loc.includes("hoa kỳ") || loc.includes("usa") || loc.includes("us") || loc.includes("united states")) return "US";
  if (loc.includes("pháp") || loc.includes("france") || loc.includes("paris")) return "FR";
  if (loc.includes("úc") || loc.includes("australia") || loc.includes("sydney")) return "AU";
  if (loc.includes("trung quốc") || loc.includes("china") || loc.includes("beijing")) return "CN";
  if (loc.includes("đài loan") || loc.includes("taiwan") || loc.includes("taipei")) return "TW";
  if (loc.includes("anh") || loc.includes("uk") || loc.includes("london") || loc.includes("united kingdom")) return "GB";
  if (loc.includes("thái lan") || loc.includes("thailand") || loc.includes("bangkok")) return "TH";
  if (loc.includes("singapore")) return "SG";
  if (loc.includes("châu âu") || loc.includes("europe")) return "EU";
  
  const trimmed = location.trim();
  if (trimmed.length >= 2 && trimmed.length <= 3 && /^[A-Za-z]+$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return "JP";
};

const blankVisaFields = (defaults?: { nationality?: string; minReturnDate?: string; destinationCountry?: string }): Pick<
  Participant,
  | "visaMode"
  | "passportNumber"
  | "passportNationality"
  | "passportIssuedAt"
  | "passportExpiresAt"
  | "passportFileUrl"
  | "destinationCountry"
  | "minReturnDate"
  | "visaFileUrl"
  | "nationalityOverride"
> => ({
  visaMode: "",
  passportNumber: "",
  passportNationality: defaults?.nationality ?? "VN",
  passportIssuedAt: "",
  passportExpiresAt: "",
  passportFileUrl: "",
  destinationCountry: defaults?.destinationCountry ?? "",
  minReturnDate: defaults?.minReturnDate ?? "",
  visaFileUrl: "",
  nationalityOverride: false,
});

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
    },
  },
};

interface DobSelectorProps {
  value: string;
  onChange: (val: string) => void;
  t: any;
  disabled?: boolean;
}

function DobSelector({ value, onChange, t, disabled }: DobSelectorProps) {
  const [yearVal, setYearVal] = useState("");
  const [monthVal, setMonthVal] = useState("");
  const [dayVal, setDayVal] = useState("");

  // Sync with prop value
  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        setYearVal(parts[0]);
        setMonthVal(parts[1]);
        setDayVal(parts[2]);
        return;
      }
    }
    if (!value) {
      setYearVal("");
      setMonthVal("");
      setDayVal("");
    }
  }, [value]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => String(currentYear - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  const getDaysInMonth = (y: string, m: string) => {
    if (!y || !m) return 31;
    return new Date(Number(y), Number(m), 0).getDate();
  };

  const maxDays = getDaysInMonth(yearVal, monthVal);
  const days = Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, "0"));

  const handlePartChange = (part: "year" | "month" | "day", val: string) => {
    let y = yearVal;
    let m = monthVal;
    let d = dayVal;

    if (part === "year") {
      y = val;
      setYearVal(val);
      if (m) {
        const nextMaxDays = getDaysInMonth(y, m);
        if (d && Number(d) > nextMaxDays) {
          d = String(nextMaxDays).padStart(2, "0");
          setDayVal(d);
        }
      }
    } else if (part === "month") {
      m = val;
      setMonthVal(val);
      if (y) {
        const nextMaxDays = getDaysInMonth(y, m);
        if (d && Number(d) > nextMaxDays) {
          d = String(nextMaxDays).padStart(2, "0");
          setDayVal(d);
        }
      }
    } else if (part === "day") {
      d = val;
      setDayVal(val);
    }

    if (y && m && d) {
      onChange(`${y}-${m}-${d}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        value={dayVal}
        onChange={(e) => handlePartChange("day", e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-300 outline-none font-semibold text-slate-900 text-sm font-sans"
      >
        <option value="">{t("landing.bookings.addParticipantsPage.day", "Ngày")}</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={monthVal}
        onChange={(e) => handlePartChange("month", e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-300 outline-none font-semibold text-slate-900 text-sm font-sans"
      >
        <option value="">{t("landing.bookings.addParticipantsPage.month", "Tháng")}</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={yearVal}
        onChange={(e) => handlePartChange("year", e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-300 outline-none font-semibold text-slate-900 text-sm font-sans"
      >
        <option value="">{t("landing.bookings.addParticipantsPage.year", "Năm")}</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CustomerAddParticipants({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<Participant[]>([]);
  const [rowStatus, setRowStatus] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [isVisaRequired, setIsVisaRequired] = useState(false);
  const [tourReturnDate, setTourReturnDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [bookingPax, setBookingPax] = useState({ adults: 0, children: 0, infants: 0 });
  const [bookerName, setBookerName] = useState<string>("");
  const [unlockedApprovedIds, setUnlockedApprovedIds] = useState<string[]>([]);
  const [confirmUnlockId, setConfirmUnlockId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const isVisaActionable = (p: Participant): boolean => {
    if (!isVisaRequired) return false;
    return p.isNew === true || !p.documentUploaded || !p.hasVisaApp;
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    if (isLoading || participants.length === 0) return;
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && hash.startsWith("#participant-")) {
      const id = hash.replace("#participant-", "");
      setHighlightedId(id);
      setTimeout(() => {
        const el = document.getElementById(`participant-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      const timer = setTimeout(() => {
        setHighlightedId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, participants]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [participantsData, bookingData] = await Promise.all([
        bookingService.getParticipants(bookingId),
        bookingService.getBookingDetail(bookingId)
      ]);

      const numAdult = (bookingData as any)?.adults ?? 0;
      const numChild = (bookingData as any)?.children ?? 0;
      const numInfant = (bookingData as any)?.infants ?? 0;
      setBookingPax({ adults: numAdult, children: numChild, infants: numInfant });
      setIsVisaRequired(!!bookingData?.isVisaRequired);
      const returnDateRaw = (bookingData as any)?.returnDate ?? (bookingData as any)?.endDate ?? (bookingData as any)?.departureDate;
      const returnDateIso = returnDateRaw ? String(returnDateRaw).split("T")[0] : "";
      setTourReturnDate(returnDateIso);

      const defaultDestCountry = getDestinationCountryIso((bookingData as any)?.location);
      let existingSeq = 0;
      const existing: Participant[] = (participantsData || []).map((p: any) => {
        const hasPassport = !!p.passport;
        const visaApps: any[] = Array.isArray(p.visaApplications) ? p.visaApplications : [];
        const latestApp = visaApps[visaApps.length - 1];
        const hasVisaApp = !!latestApp;
        const presetMode: VisaMode = latestApp?.isSystemAssisted
          ? "needs_support"
          : hasPassport
            ? "has_visa"
            : "";
        const guestNationality = p.nationality || "VN";
        const passportNationalityVal = p.passport?.nationality ?? p.nationality ?? "VN";
        return {
          id: p.participantId || p.id || `existing-${Date.now()}-${existingSeq++}`,
          fullName: p.fullName,
          dob: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
          gender: typeof p.gender === "number" ? p.gender : 0,
          nationality: guestNationality,
          participantType: p.participantType || "Adult",
          designatedType: p.participantType || "Adult",
          documentUploaded: hasPassport,
          hasVisaApp,
          isNew: false,
          ...blankVisaFields({ nationality: guestNationality, minReturnDate: returnDateIso, destinationCountry: defaultDestCountry }),
          visaMode: presetMode,
          nationalityOverride: guestNationality !== passportNationalityVal,
          passportNumber: p.passport?.passportNumber ?? "",
          passportNationality: passportNationalityVal,
          passportIssuedAt: p.passport?.issuedAt ? p.passport.issuedAt.split("T")[0] : "",
          passportExpiresAt: p.passport?.expiresAt ? p.passport.expiresAt.split("T")[0] : "",
          passportFileUrl: p.passport?.fileUrl ?? "",
          destinationCountry: latestApp?.destinationCountry ?? defaultDestCountry,
          minReturnDate: latestApp?.minReturnDate ? latestApp.minReturnDate.split("T")[0] : returnDateIso,
          visaFileUrl: latestApp?.visaFileUrl ?? "",
          passportId: p.passport?.passportId ?? p.passport?.id ?? "",
          infoReviewStatus: p.infoReviewStatus || "NotReviewed",
          infoRejectionReason: p.infoRejectionReason ?? null,
        };
      });

      const bookerNameVal = (bookingData as any)?.customerName ?? "";
      setBookerName(bookerNameVal);

      const remainingByType = {
        Adult: Math.max(0, numAdult - existing.filter(p => p.participantType === "Adult").length),
        Child: Math.max(0, numChild - existing.filter(p => p.participantType === "Child").length),
        Infant: Math.max(0, numInfant - existing.filter(p => p.participantType === "Infant").length),
      };

      const blanks: Participant[] = [];
      let seq = Date.now();
      const pushBlank = (type: string) => {
        const isFirstBlank = blanks.length === 0;
        const prefillName = (isFirstBlank && existing.length === 0 && bookerNameVal) ? bookerNameVal : "";
        blanks.push({
          id: `new-${seq++}`,
          fullName: prefillName,
          dob: "",
          gender: 0,
          nationality: "VN",
          participantType: type,
          designatedType: type,
          documentUploaded: false,
          hasVisaApp: false,
          isNew: true,
          ...blankVisaFields({ nationality: "VN", minReturnDate: returnDateIso, destinationCountry: defaultDestCountry }),
          infoReviewStatus: "NotReviewed",
          infoRejectionReason: null,
        });
      };
      for (let i = 0; i < remainingByType.Adult; i++) pushBlank("Adult");
      for (let i = 0; i < remainingByType.Child; i++) pushBlank("Child");
      for (let i = 0; i < remainingByType.Infant; i++) pushBlank("Infant");

      const merged = [...existing, ...blanks];
      const finalParticipants = merged.length === 0 ? blanks : merged;
      
      const initialStatuses: Record<string, "idle" | "saving" | "saved" | "error"> = {};
      finalParticipants.forEach(item => {
        if (!item.isNew && !isVisaActionable(item)) {
          initialStatuses[item.id] = "saved";
        } else {
          initialStatuses[item.id] = "idle";
        }
      });
      setRowStatus(initialStatuses);
      setInitialSnapshot(JSON.parse(JSON.stringify(finalParticipants)));
      setParticipants(finalParticipants);
    } catch (e) {
      console.error(e);
      toast.error(t("landing.bookings.addParticipantsPage.loadError", "Failed to load data"));
    } finally {
      setIsLoading(false);
    }
  };

  const updateParticipant = (id: string, field: keyof Participant, value: any) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateNationality = (id: string, source: "guest" | "passport", value: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (p.nationalityOverride) {
        // override active: chỉ update field user chạm
        return source === "guest"
          ? { ...p, nationality: value }
          : { ...p, passportNationality: value };
      }
      // sync mode: update cả 2
      return { ...p, nationality: value, passportNationality: value };
    }));
  };

  const getAgeFromDob = (dob: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getAgeRange = (type: string): { minAge: number; maxAge: number | null } => {
    if (type === "Infant") return { minAge: 0, maxAge: 1 };
    if (type === "Child") return { minAge: 2, maxAge: 11 };
    return { minAge: 12, maxAge: null };
  };

  const getDobDateRange = (type: string): { min: string; max: string } => {
    const today = new Date();
    const { minAge, maxAge } = getAgeRange(type);
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    const minDate = maxAge !== null
      ? new Date(today.getFullYear() - (maxAge + 1), today.getMonth(), today.getDate() + 1)
      : new Date(1900, 0, 1);
    return {
      min: minDate.toISOString().split("T")[0],
      max: maxDate.toISOString().split("T")[0],
    };
  };

  const getAgeLabel = (type: string): string => {
    const { minAge, maxAge } = getAgeRange(type);
    if (maxAge === null) return `từ ${minAge} tuổi trở lên`;
    return `từ ${minAge} đến ${maxAge} tuổi`;
  };

  const isDobValidForType = (dob: string, type: string): boolean => {
    const age = getAgeFromDob(dob);
    if (age === null) return true;
    const { minAge, maxAge } = getAgeRange(type);
    if (age < minAge) return false;
    if (maxAge !== null && age > maxAge) return false;
    return true;
  };

  const handleDobChange = (id: string, dob: string) => {
    const age = getAgeFromDob(dob);
    let inferredType = "Adult";
    if (age !== null) {
      if (age >= 12) inferredType = "Adult";
      else if (age >= 2) inferredType = "Child";
      else inferredType = "Infant";
    }
    setParticipants(prev =>
      prev.map(p => (p.id === id ? { ...p, dob, participantType: inferredType } : p))
    );
  };

  const handleFileUpload = async (participantId: string, field: "passportFileUrl" | "visaFileUrl", file: File) => {
    setUploadingFiles((prev) => ({ ...prev, [`${participantId}-${field}`]: true }));
    try {
      const res = await fileService.uploadFile(file);
      updateParticipant(participantId, field, res.url);
      toast.success(t("landing.bookings.addParticipantsPage.savedSuccess"));
    } catch (err) {
      console.error(err);
      toast.error(t("landing.bookings.addParticipantsPage.saveFailed"));
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [`${participantId}-${field}`]: false }));
    }
  };

  const validateRow = (p: Participant): string | null => {
    const guestLabel = p.fullName || t("landing.bookings.addParticipantsPage.guest", "Hành khách");
    if (!p.fullName.trim()) return t("landing.bookings.addParticipantsPage.validationFullNameRequired", "Hành khách thiếu họ tên.");
    if (!p.dob) return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationDobRequired", "vui lòng nhập ngày sinh.")}`;
    if (new Date(p.dob) > new Date()) {
      return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationDobFuture", "ngày sinh không thể ở tương lai.")}`;
    }
    if (!isVisaActionable(p)) return null;
    if (!p.visaMode) return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationVisaModeRequired", "vui lòng chọn tình trạng visa.")}`;
    if (p.visaMode) {
      if (p.visaMode === "has_visa") {
        if (!p.passportNumber.trim()) return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationPassportNumberRequired", "thiếu số passport.")}`;
        if (!p.passportNationality.trim()) return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationPassportNationalityRequired", "thiếu quốc tịch passport.")}`;
        if (!p.passportIssuedAt) return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationPassportIssuedRequired", "thiếu ngày cấp passport.")}`;
        if (!p.passportExpiresAt) return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationPassportExpiresRequired", "thiếu ngày hết hạn passport.")}`;
        if (tourReturnDate && new Date(p.passportExpiresAt) < new Date(tourReturnDate)) {
          return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationPassportExpiredBeforeTour", { date: tourReturnDate })}`;
        }
      } else if (p.visaMode === "needs_support") {
        if (!p.passportFileUrl.trim()) return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationPassportImageRequired", "thiếu file ảnh passport. Để hệ thống hỗ trợ, bạn cần upload ảnh mặt passport.")}`;
      }
    }
    if (p.visaMode === "has_visa") {
      if (!p.destinationCountry.trim()) return `${guestLabel}: ${t("landing.bookings.addParticipantsPage.validationDestinationRequired", "thiếu quốc gia đến.")}`;
    }
    return null;
  };

  const diffParticipant = (oldP: Participant | undefined, newP: Participant) => {
    if (!oldP) {
      return {
        participantChanged: true,
        passportChanged: !!newP.visaMode,
        visaChanged: newP.visaMode === "has_visa" && !newP.hasVisaApp,
        supportChanged: newP.visaMode === "needs_support" && !newP.hasVisaApp,
      };
    }

    const participantChanged =
      oldP.fullName !== newP.fullName ||
      oldP.dob !== newP.dob ||
      oldP.gender !== newP.gender ||
      oldP.nationality !== newP.nationality;

    const passportChanged =
      newP.visaMode !== "" &&
      (oldP.visaMode !== newP.visaMode ||
        oldP.passportNumber !== newP.passportNumber ||
        oldP.passportNationality !== newP.passportNationality ||
        oldP.passportIssuedAt !== newP.passportIssuedAt ||
        oldP.passportExpiresAt !== newP.passportExpiresAt ||
        oldP.passportFileUrl !== newP.passportFileUrl);

    const visaChanged =
      newP.visaMode === "has_visa" &&
      !newP.hasVisaApp &&
      (oldP.visaMode !== "has_visa" ||
        oldP.destinationCountry !== newP.destinationCountry ||
        oldP.minReturnDate !== newP.minReturnDate ||
        oldP.visaFileUrl !== newP.visaFileUrl);

    const supportChanged =
      newP.visaMode === "needs_support" &&
      !newP.hasVisaApp &&
      oldP.visaMode !== "needs_support";

    return {
      participantChanged,
      passportChanged,
      visaChanged,
      supportChanged,
    };
  };

  const getPaxCountMismatch = () => {
    const currentCounts = {
      Adult: participants.filter(p => p.participantType === "Adult").length,
      Child: participants.filter(p => p.participantType === "Child").length,
      Infant: participants.filter(p => p.participantType === "Infant").length,
    };
    const requiredCounts = {
      Adult: bookingPax.adults,
      Child: bookingPax.children,
      Infant: bookingPax.infants,
    };
    const mismatches: string[] = [];
    if (currentCounts.Adult !== requiredCounts.Adult) {
      mismatches.push(`${currentCounts.Adult}/${requiredCounts.Adult} ${t("landing.bookings.addParticipantsPage.adult", "Người lớn")}`);
    }
    if (currentCounts.Child !== requiredCounts.Child) {
      mismatches.push(`${currentCounts.Child}/${requiredCounts.Child} ${t("landing.bookings.addParticipantsPage.child", "Trẻ em")}`);
    }
    if (currentCounts.Infant !== requiredCounts.Infant) {
      mismatches.push(`${currentCounts.Infant}/${requiredCounts.Infant} ${t("landing.bookings.addParticipantsPage.infant", "Em bé")}`);
    }
    return mismatches.length > 0 ? mismatches.join(", ") : null;
  };

  const handleSave = async () => {
    if (participants.length === 0) {
      router.push(`/bookings/${bookingId}#visa`);
      return;
    }

    const mismatch = getPaxCountMismatch();
    if (mismatch) {
      toast.error(t("landing.bookings.addParticipantsPage.mismatchToastError", { mismatch }));
      return;
    }

    setIsSaving(true);
    let allSucceeded = true;

    for (const p of participants) {
      const oldP = initialSnapshot.find(item => item.id === p.id);
      const diff = diffParticipant(oldP, p);
      const isDirty = p.isNew || diff.participantChanged || diff.passportChanged || diff.visaChanged || diff.supportChanged;

      if (!isDirty) {
        setRowStatus(prev => ({ ...prev, [p.id]: "saved" }));
        continue;
      }

      const err = validateRow(p);
      if (err) {
        setRowStatus(prev => ({ ...prev, [p.id]: "error" }));
        setRowError(prev => ({ ...prev, [p.id]: err }));
        allSucceeded = false;
        continue;
      }

      setRowStatus(prev => ({ ...prev, [p.id]: "saving" }));
      setRowError(prev => {
        const copy = { ...prev };
        delete copy[p.id];
        return copy;
      });

      try {
        let currentParticipantId = p.isNew ? undefined : p.id;

        if (p.isNew || diff.participantChanged) {
          if (p.isNew) {
            currentParticipantId = await bookingService.createParticipant(bookingId, {
              participantType: p.participantType || "Adult",
              fullName: p.fullName,
              dateOfBirth: p.dob ? new Date(p.dob).toISOString() : null,
              gender: p.gender,
              nationality: p.nationality || "VN",
            });
          } else {
            await bookingService.updateParticipant(bookingId, p.id, {
              participantId: p.id,
              participantType: p.participantType || "Adult",
              fullName: p.fullName,
              dateOfBirth: p.dob ? new Date(p.dob).toISOString() : null,
              gender: p.gender,
              nationality: p.nationality || "VN",
            });
            currentParticipantId = p.id;
          }
        }

        let passportId = p.passportId || "";
        if (isVisaRequired && currentParticipantId && p.visaMode) {
          if (diff.passportChanged) {
            passportId = await bookingService.upsertParticipantPassport(bookingId, currentParticipantId, {
              passportNumber: p.passportNumber.trim() ? p.passportNumber.trim() : null,
              nationality: p.passportNationality || null,
              issuedAt: p.passportIssuedAt ? new Date(p.passportIssuedAt).toISOString() : null,
              expiresAt: p.passportExpiresAt ? new Date(p.passportExpiresAt).toISOString() : null,
              fileUrl: p.passportFileUrl || null,
            });
          }

          if (p.visaMode === "has_visa" && diff.visaChanged) {
            await bookingService.submitVisaApplication(bookingId, {
              bookingParticipantId: currentParticipantId,
              passportId: passportId,
              destinationCountry: p.destinationCountry,
              minReturnDate: p.minReturnDate ? new Date(p.minReturnDate).toISOString() : undefined,
              visaFileUrl: p.visaFileUrl || undefined,
            });
          } else if (p.visaMode === "needs_support" && diff.supportChanged) {
            await bookingService.requestVisaSupport(bookingId, currentParticipantId);
          }
        }

        const hasVisaAppNow = (p.visaMode === "has_visa" && diff.visaChanged) || (p.visaMode === "needs_support" && diff.supportChanged) ? true : p.hasVisaApp;
        const updatedParticipant: Participant = {
          ...p,
          id: currentParticipantId!,
          isNew: false,
          passportId,
          hasVisaApp: hasVisaAppNow,
        };

        setParticipants(prev => prev.map(item => item.id === p.id ? updatedParticipant : item));
        setInitialSnapshot(prev => {
          const exists = prev.some(item => item.id === p.id);
          if (exists) {
            return prev.map(item => item.id === p.id ? updatedParticipant : item);
          } else {
            return [...prev, updatedParticipant];
          }
        });
        setRowStatus(prev => {
          const copy = { ...prev };
          delete copy[p.id];
          copy[currentParticipantId!] = "saved";
          return copy;
        });
        setRowError(prev => {
          const copy = { ...prev };
          delete copy[p.id];
          delete copy[currentParticipantId!];
          return copy;
        });
      } catch (err: any) {
        console.error(`Failed to save participant ${p.fullName || p.id}:`, err);
        const errMsg = err?.response?.data?.message || err?.message || "Lưu thông tin thất bại";
        setRowStatus(prev => ({ ...prev, [p.id]: "error" }));
        setRowError(prev => ({ ...prev, [p.id]: errMsg }));
        allSucceeded = false;
      }
    }

    setIsSaving(false);

    if (allSucceeded) {
      toast.success(t("landing.bookings.addParticipantsPage.saveSuccess"));
      router.push(`/bookings/${bookingId}#visa`);
    } else {
      toast.error(t("landing.bookings.addParticipantsPage.saveFailedToastError"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f9fafb] flex items-center justify-center">
        <Spinner size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  // Count states for sidebar stats
  const totalCount = participants.length;
  const savedCount = Object.values(rowStatus).filter(s => s === "saved").length;
  const errorCount = Object.values(rowStatus).filter(s => s === "error").length;
  const savingCount = Object.values(rowStatus).filter(s => s === "saving").length;
  const pendingCount = totalCount - savedCount - errorCount - savingCount;

  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] font-sans antialiased text-slate-900 selection:bg-slate-900/5 selection:text-slate-900">
      
      {/* Outer Layout wrapper - Asymmetric split bento grid */}
      <div className="max-w-[1280px] mx-auto px-6 py-12 pt-24">
        
        {/* Top navigational bar */}
        <div className="mb-10">
          <Link
            href={`/bookings/${bookingId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors duration-200 active:scale-[0.98]"
          >
            <ArrowLeft weight="bold" className="size-4" />
            {t("landing.bookings.addParticipantsPage.backToBooking")}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">
          
          {/* STICKY SIDEBAR (Left Column) - Premium spacing & layout */}
          <div className="lg:sticky lg:top-24 flex flex-col gap-6">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900 leading-tight">
                {t("landing.bookings.addParticipantsPage.title")}
              </h1>
              <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed max-w-[32ch]">
                {t("landing.bookings.addParticipantsPage.subtitle", { bookingId })}
              </p>
            </div>

            {/* Visual Progress Dashboard Bento Widget */}
            <div className="p-1.5 rounded-[2.5rem] bg-slate-100 border border-slate-200/50 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.02)]">
              <div className="bg-white rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-6">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">{t("landing.bookings.addParticipantsPage.statusOverview")}</h2>
                  <div className="flex flex-col gap-4">
                    
                    {/* Visual grid status list */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-slate-900 block"></span>
                        <span className="text-sm font-bold text-slate-700">{t("landing.bookings.addParticipantsPage.totalGuests")}</span>
                      </div>
                      <span className="font-mono text-base font-bold text-slate-900">{totalCount}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-emerald-500 block"></span>
                        <span className="text-sm font-bold text-slate-700">{t("landing.bookings.addParticipantsPage.savedSuccessfully")}</span>
                      </div>
                      <span className="font-mono text-base font-bold text-slate-900">{savedCount}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-amber-500 block"></span>
                        <span className="text-sm font-bold text-slate-700">{t("landing.bookings.addParticipantsPage.pendingChanges")}</span>
                      </div>
                      <span className="font-mono text-base font-bold text-slate-900">{pendingCount}</span>
                    </div>

                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-red-500 block"></span>
                        <span className="text-sm font-bold text-slate-700">{t("landing.bookings.addParticipantsPage.failedErrors")}</span>
                      </div>
                      <span className="font-mono text-base font-bold text-slate-900">{errorCount}</span>
                    </div>

                  </div>
                </div>

                {/* Action Progress Bar */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${totalCount ? (savedCount / totalCount) * 100 : 0}%` }}
                      className="h-full bg-emerald-500 transition-all duration-750 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    />
                    <div
                      style={{ width: `${totalCount ? (savingCount / totalCount) * 100 : 0}%` }}
                      className="h-full bg-slate-400 animate-pulse"
                    />
                    <div
                      style={{ width: `${totalCount ? (errorCount / totalCount) * 100 : 0}%` }}
                      className="h-full bg-red-500 transition-all duration-750 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3 text-[10px] font-bold text-slate-400 tracking-wider">
                    <span>{t("landing.bookings.addParticipantsPage.progress")}</span>
                    <span>{Math.round(totalCount ? (savedCount / totalCount) * 100 : 0)}%</span>
                  </div>
                </div>

                {/* Passenger Configuration Widget */}
                <div className="border-t border-slate-100 pt-6 font-sans">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 font-sans">{t("landing.bookings.addParticipantsPage.passengerStructure")}</h2>
                  <div className="flex flex-col gap-3 font-sans">
                    <div className="flex items-center justify-between text-xs font-bold font-sans">
                      <span className="text-slate-500">{t("landing.bookings.addParticipantsPage.adultLabel")}</span>
                      <span className={`text-[11px] font-bold transition-colors ${
                        participants.filter(p => p.participantType === "Adult").length === bookingPax.adults 
                          ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md" 
                          : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"
                      }`}>
                        {participants.filter(p => p.participantType === "Adult").length} / {bookingPax.adults}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold font-sans">
                      <span className="text-slate-500">{t("landing.bookings.addParticipantsPage.childLabel")}</span>
                      <span className={`text-[11px] font-bold transition-colors ${
                        participants.filter(p => p.participantType === "Child").length === bookingPax.children 
                          ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md" 
                          : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"
                      }`}>
                        {participants.filter(p => p.participantType === "Child").length} / {bookingPax.children}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold font-sans">
                      <span className="text-slate-500">{t("landing.bookings.addParticipantsPage.infantLabel")}</span>
                      <span className={`text-[11px] font-bold transition-colors ${
                        participants.filter(p => p.participantType === "Infant").length === bookingPax.infants 
                          ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md" 
                          : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"
                      }`}>
                        {participants.filter(p => p.participantType === "Infant").length} / {bookingPax.infants}
                      </span>
                    </div>
                  </div>

                  {getPaxCountMismatch() && (
                    <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800 font-bold leading-relaxed flex items-start gap-2">
                      <WarningCircle weight="fill" className="size-4 shrink-0 mt-0.5 text-amber-600" />
                      <span>
                        {t("landing.bookings.addParticipantsPage.paxMismatchWarning")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tour visa information bento widget */}
            {isVisaRequired && (
              <div className="p-1.5 rounded-[2.5rem] bg-slate-900 border border-slate-950 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.15)] relative overflow-hidden">
                <div className="bg-slate-850 rounded-[calc(2.5rem-0.375rem)] p-8 relative overflow-hidden flex flex-col gap-4">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                      <Info weight="fill" className="size-5 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">{t("landing.bookings.addParticipantsPage.visaNote")}</span>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-white mb-2">{t("landing.bookings.addParticipantsPage.tourRequiresVisa")}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {t("landing.bookings.addParticipantsPage.visaExplanation")}
                    </p>
                  </div>
                  {/* Abstract shape graphic */}
                  <div className="absolute -bottom-12 -right-12 size-36 bg-slate-800 rounded-full blur-2xl opacity-40 pointer-events-none"></div>
                </div>
              </div>
            )}

          </div>

          {/* MAIN FORM GRID STREAM (Right Column) - Staggered waterfall reveals */}
          <div className="flex flex-col">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-8"
            >
              {/* Premium Quick Guide Card */}
              <div className="p-1.5 rounded-[2.5rem] bg-indigo-50/60 border border-indigo-100/50 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.03)] overflow-hidden">
                <div className="bg-white rounded-[calc(2.5rem-0.375rem)] p-6 md:p-8 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Info weight="bold" className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                        {t("landing.bookings.addParticipantsPage.quickGuideTitle")}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                        {t("landing.bookings.addParticipantsPage.quickGuideSubtitle")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-indigo-500"></span>
                        {t("landing.bookings.addParticipantsPage.guideAgeTitle")}
                      </span>
                      <ul className="list-disc pl-4 text-[11px] text-slate-500 leading-relaxed font-medium space-y-1">
                        <li>{t("landing.bookings.addParticipantsPage.guideAgeItem1")}</li>
                        <li>{t("landing.bookings.addParticipantsPage.guideAgeItem2")}</li>
                      </ul>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-indigo-500"></span>
                        {t("landing.bookings.addParticipantsPage.guideVisaTitle")}
                      </span>
                      <ul className="list-disc pl-4 text-[11px] text-slate-500 leading-relaxed font-medium space-y-1">
                        <li>{t("landing.bookings.addParticipantsPage.guideVisaItem1")}</li>
                        <li>{t("landing.bookings.addParticipantsPage.guideVisaItem2")}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {participants.map((p, index) => {
                const isFieldsDisabled = !p.isNew && p.infoReviewStatus === "Approved" && !unlockedApprovedIds.includes(p.id);
                return (
                  <React.Fragment key={p.id}>
                    {/* Card 1: Basic details and Passport if isVisaRequired */}
                    <motion.div
                      id={`participant-${p.id}`}
                      variants={cardVariants}
                      className={`p-1.5 rounded-[2.5rem] bg-slate-200/50 border shadow-[0_15px_30px_-10px_rgba(28,25,23,0.03)] hover:shadow-[0_25px_45px_-15px_rgba(28,25,23,0.06)] transition-all duration-750 ease-[cubic-bezier(0.32,0.72,0,1)] relative overflow-hidden ${
                        highlightedId === p.id 
                          ? "border-amber-400 ring-4 ring-amber-400/20" 
                          : !p.isNew && p.infoReviewStatus === "Rejected"
                            ? "border-red-300 ring-2 ring-red-500/5"
                            : "border-slate-300/30"
                      }`}
                    >
                      <div className="bg-white rounded-[calc(2.5rem-0.375rem)] p-8 md:p-10 relative overflow-hidden border border-slate-100/50 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                        
                        {/* Decorative color border on side matching status */}
                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                          rowStatus[p.id] === "saved" ? "bg-emerald-500" :
                          rowStatus[p.id] === "error" ? "bg-red-500" :
                          rowStatus[p.id] === "saving" ? "bg-slate-400" :
                          !p.isNew && p.infoReviewStatus === "Approved" ? "bg-emerald-500" :
                          !p.isNew && p.infoReviewStatus === "Rejected" ? "bg-red-500" :
                          "bg-slate-200/60"
                        }`} />

                        {/* Title & Top indicators */}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                            {t("landing.bookings.addParticipantsPage.guestNumberWithDesignated", {
                              index: index + 1,
                              type: t(`landing.bookings.addParticipantsPage.${(p.designatedType || p.participantType).toLowerCase()}`)
                            })}
                          </h3>
                          
                          <div className="flex items-center gap-2">
                            <AnimatePresence mode="wait">
                              {!p.isNew && p.infoReviewStatus === "Approved" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                                  <CheckCircle weight="fill" className="size-3.5 text-emerald-600" />
                                  {t("landing.bookings.addParticipantsPage.statusApproved", "Đã duyệt")}
                                </span>
                              )}
                              {!p.isNew && p.infoReviewStatus === "Rejected" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
                                  <WarningCircle weight="fill" className="size-3.5 text-red-600" />
                                  {t("landing.bookings.addParticipantsPage.statusRejected", "Từ chối")}
                                </span>
                              )}
                              {!p.isNew && p.infoReviewStatus === "NotReviewed" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full border border-slate-200">
                                  <Info weight="fill" className="size-3.5 text-slate-400" />
                                  {t("landing.bookings.addParticipantsPage.statusNotReviewed", "Chờ duyệt")}
                                </span>
                              )}

                              {rowStatus[p.id] === "saving" && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-extrabold rounded-full border border-slate-200"
                                >
                                  <Spinner className="animate-spin size-3.5" />
                                  {t("landing.bookings.addParticipantsPage.saving")}
                                </motion.span>
                              )}
                              {rowStatus[p.id] === "saved" && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-full border border-emerald-100"
                                >
                                  <CheckCircle weight="fill" className="size-4 text-emerald-600" />
                                  {t("landing.bookings.addParticipantsPage.saved")}
                                </motion.span>
                              )}
                              {rowStatus[p.id] === "error" && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-extrabold rounded-full border border-red-100"
                                >
                                  <WarningCircle weight="fill" className="size-4 text-red-600" />
                                  {t("landing.bookings.addParticipantsPage.error")}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Rejected Warn Banner */}
                        {!p.isNew && p.infoReviewStatus === "Rejected" && (
                          <div className="flex flex-col gap-4 bg-red-50 border border-red-200 p-5 rounded-3xl mb-2">
                            <div className="flex items-start gap-3">
                              <WarningCircle weight="fill" className="size-5 text-red-600 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-red-800 font-bold">
                                  {t("participantReview.customerBanner.title", "Thông tin hành khách bị từ chối duyệt")}
                                </p>
                                <p className="text-xs text-red-700 font-semibold mt-1 leading-relaxed">
                                  {t("landing.bookings.addParticipantsPage.rejectedBannerReason", "Lý do: ")} {p.infoRejectionReason || t("landing.bookings.addParticipantsPage.noReasonProvided", "Cần cập nhật lại thông tin chính xác.")}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pl-8">
                              <button
                                type="button"
                                onClick={() => {
                                  const nameInput = document.getElementById(`participant-${p.id}`)?.querySelector('input');
                                  if (nameInput) (nameInput as HTMLInputElement).focus();
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                              >
                                {t("participantReview.customerBanner.cta", "Cập nhật thông tin")}
                              </button>
                              <a
                                href="tel:19001234"
                                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5"
                              >
                                <HandHeart className="size-3.5 text-slate-500" />
                                {t("participantReview.customerBanner.hotline", "Liên hệ hotline")}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Approved Lock Alert Banner */}
                        {isFieldsDisabled && (
                          <div className="flex items-center justify-between gap-3 bg-amber-50/60 border border-amber-250 p-4 rounded-2xl mb-2">
                            <div className="flex items-center gap-2">
                              <WarningCircle weight="fill" className="size-5 text-amber-500 shrink-0" />
                              <p className="text-xs text-amber-800 font-semibold leading-normal">
                                {t("landing.bookings.addParticipantsPage.approvedLockWarning", "Thông tin đã được duyệt. Sửa đổi sẽ yêu cầu duyệt lại.")}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConfirmUnlockId(p.id)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
                            >
                              {t("landing.bookings.addParticipantsPage.unlockBtn", "Mở khóa chỉnh sửa")}
                            </button>
                          </div>
                        )}

                      {isVisaRequired ? (
                        <div className="border border-slate-200/60 rounded-3xl p-6 md:p-8 bg-slate-50/30">
                          <h4 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 font-sans">
                            <IdentificationCard weight="fill" className="size-5 text-slate-700" />
                            {t("landing.bookings.addParticipantsPage.passengerPassportInfo")}
                          </h4>

                          {/* Basic user details grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">{t("landing.bookings.addParticipantsPage.fullName")}</label>
                              <input
                                type="text"
                                value={p.fullName}
                                onChange={(e) => updateParticipant(p.id, "fullName", e.target.value)}
                                placeholder={t("landing.bookings.addParticipantsPage.fullNamePlaceholder")}
                                disabled={isFieldsDisabled || rowStatus[p.id] === "saving"}
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                              />
                              {index === 0 && p.isNew && bookerName && p.fullName === bookerName && (
                                <p className="text-[10px] text-slate-400 mt-1 font-sans">{t("landing.bookings.addParticipantsPage.prefilledNote")}</p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">
                                {t("landing.bookings.addParticipantsPage.dateOfBirth")}
                              </label>
                              <DobSelector
                                value={p.dob}
                                onChange={(val) => handleDobChange(p.id, val)}
                                t={t}
                                disabled={isFieldsDisabled || rowStatus[p.id] === "saving"}
                              />
                              {p.dob && (() => {
                                const age = getAgeFromDob(p.dob);
                                if (age === null) return null;
                                const isMismatch = p.designatedType && p.participantType !== p.designatedType;
                                return (
                                  <div className="flex flex-col gap-1.5 mt-1">
                                    <span className={`text-[11px] font-bold flex items-center gap-1.5 font-sans ${isMismatch ? "text-amber-600" : "text-emerald-600"}`}>
                                      {isMismatch ? (
                                        <WarningCircle weight="fill" className="size-3.5 text-amber-500" />
                                      ) : (
                                        <CheckCircle weight="fill" className="size-3.5 text-emerald-600" />
                                      )}
                                      {age} {t("landing.bookings.addParticipantsPage.yearsOld")} — {p.participantType === "Adult" ? t("landing.bookings.addParticipantsPage.adult") : p.participantType === "Child" ? t("landing.bookings.addParticipantsPage.child") : t("landing.bookings.addParticipantsPage.infant")}
                                    </span>
                                    {isMismatch && (
                                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100/65 px-2 py-1 rounded-lg leading-normal font-sans">
                                        {t("landing.bookings.addParticipantsPage.cardTypeMismatchWarning", {
                                          inferred: t("landing.bookings.addParticipantsPage." + p.participantType.toLowerCase()),
                                          designated: t("landing.bookings.addParticipantsPage." + (p.designatedType || "adult").toLowerCase())
                                        })}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">{t("landing.bookings.addParticipantsPage.gender", "Giới tính")}</label>
                              <select
                                value={p.gender}
                                onChange={(e) => updateParticipant(p.id, "gender", Number(e.target.value))}
                                disabled={isFieldsDisabled || rowStatus[p.id] === "saving"}
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                <option value={0}>{t("landing.bookings.addParticipantsPage.male", "Nam")}</option>
                                <option value={1}>{t("landing.bookings.addParticipantsPage.female", "Nữ")}</option>
                                <option value={2}>{t("landing.bookings.addParticipantsPage.otherGender", "Khác")}</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">{t("landing.bookings.addParticipantsPage.currentNationality", "Quốc tịch hiện tại")}</label>
                              <input
                                type="text"
                                value={p.nationality}
                                maxLength={3}
                                onChange={(e) => updateNationality(p.id, "guest", e.target.value.toUpperCase())}
                                placeholder={t("landing.bookings.addParticipantsPage.nationalityPlaceholder", "VN, US, JP...")}
                                disabled={isFieldsDisabled || rowStatus[p.id] === "saving"}
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                              />
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">{t("landing.bookings.addParticipantsPage.passengerType", "Phân loại hành khách")}</label>
                              <div className="flex p-1 rounded-2xl bg-slate-100/80 border border-slate-200/50 w-full relative">
                                {["Adult", "Child", "Infant"].map((type) => {
                                  const isActive = p.participantType === type;
                                  const labels: Record<string, string> = {
                                    Adult: t("landing.bookings.addParticipantsPage.adultLabel", "Người lớn (≥12t)"),
                                    Child: t("landing.bookings.addParticipantsPage.childLabel", "Trẻ em (2-11t)"),
                                    Infant: t("landing.bookings.addParticipantsPage.infantLabel", "Em bé (<2t)")
                                  };
                                  const activeClass = type === "Adult" 
                                    ? "bg-slate-900 text-white shadow-sm" 
                                    : type === "Child" 
                                      ? "bg-indigo-600 text-white shadow-sm" 
                                      : "bg-emerald-600 text-white shadow-sm";
                                  return (
                                    <div
                                      key={type}
                                      className={`flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 select-none font-sans ${
                                        isActive 
                                          ? activeClass 
                                          : "text-slate-400 opacity-60"
                                      }`}
                                    >
                                      {labels[type]}
                                    </div>
                                  );
                                })}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider pl-1 font-sans font-medium">{t("landing.bookings.addParticipantsPage.autoClassificationNote", "Phân loại tự động cập nhật theo ngày sinh")}</span>
                            </div>
                          </div>

                          {/* Block 3: Passport (renders only when visaMode is set) */}
                          {p.visaMode && (
                            <div>
                              {/* Divider between Block 1 and Block 3 */}
                              <div className="border-t border-slate-200 my-6" />

                              <div className="flex flex-col gap-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">{t("landing.bookings.addParticipantsPage.passportInfoLabel", "Thông tin passport")}</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {p.visaMode === "has_visa" && (
                                    <>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 font-sans">{t("landing.bookings.addParticipantsPage.passportNumber", "Passport Number")}</label>
                                        <input
                                          type="text"
                                          value={p.passportNumber}
                                          onChange={(e) => updateParticipant(p.id, "passportNumber", e.target.value)}
                                          placeholder={t("landing.bookings.addParticipantsPage.passportNumberPlaceholder", "C1234567")}
                                          disabled={isFieldsDisabled || rowStatus[p.id] === "saving"}
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 font-sans">{t("landing.bookings.addParticipantsPage.passportNationality", "Quốc gia cấp hộ chiếu")}</label>
                                        <input
                                          type="text"
                                          maxLength={3}
                                          value={p.passportNationality}
                                          onChange={(e) => updateNationality(p.id, "passport", e.target.value.toUpperCase())}
                                          placeholder="VN"
                                          disabled={isFieldsDisabled || rowStatus[p.id] === "saving"}
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                        {/* Override Checkbox UI (Task 1.6) */}
                                        <label className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-sans select-none">
                                          <input
                                            type="checkbox"
                                            checked={p.nationalityOverride}
                                            disabled={isFieldsDisabled || rowStatus[p.id] === "saving"}
                                            onChange={(e) => {
                                              const checked = e.target.checked;
                                              if (!checked) {
                                                // resume sync: overwrite passportNationality về match nationality
                                                setParticipants(prev => prev.map(pp =>
                                                  pp.id === p.id
                                                    ? { ...pp, nationalityOverride: false, passportNationality: pp.nationality }
                                                    : pp
                                                ));
                                              } else {
                                                updateParticipant(p.id, "nationalityOverride", true);
                                              }
                                            }}
                                            className="rounded border-slate-350 text-slate-900 focus:ring-slate-900 disabled:opacity-50"
                                          />
                                          {t("landing.bookings.addParticipantsPage.nationalityMismatchCheckbox", "Hộ chiếu cấp ở quốc gia khác với quốc tịch hiện tại")}
                                        </label>
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 font-sans">{t("landing.bookings.addParticipantsPage.passportIssuedAt", "Issued Date")}</label>
                                        <input
                                          type="date"
                                          value={p.passportIssuedAt}
                                          onChange={(e) => updateParticipant(p.id, "passportIssuedAt", e.target.value)}
                                          disabled={isFieldsDisabled || rowStatus[p.id] === "saving"}
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 font-sans">
                                          {t("landing.bookings.addParticipantsPage.passportExpiresAt", "Expires Date")} {tourReturnDate && <span className="font-semibold text-slate-400 text-[10px] tracking-tight">({t("landing.bookings.addParticipantsPage.afterDate", "sau")} {tourReturnDate})</span>}
                                        </label>
                                        <input
                                          type="date"
                                          value={p.passportExpiresAt}
                                          onChange={(e) => updateParticipant(p.id, "passportExpiresAt", e.target.value)}
                                          disabled={isFieldsDisabled || rowStatus[p.id] === "saving"}
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                      </div>
                                    </>
                                  )}

                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 block mb-1.5 font-sans">
                                      {p.visaMode === "needs_support" 
                                        ? t("landing.bookings.addParticipantsPage.uploadPassportRequired", "Upload ảnh mặt Passport (Bắt buộc)") 
                                        : t("landing.bookings.addParticipantsPage.passportImageOptional", "Ảnh Passport (tùy chọn)")}
                                    </label>
                                    {p.passportFileUrl ? (
                                      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]">
                                        <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                          <File className="size-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <a href={p.passportFileUrl} target="_blank" rel="noreferrer" className="text-slate-900 hover:text-slate-700 text-xs font-bold truncate block hover:underline font-sans">
                                            {t("landing.bookings.addParticipantsPage.viewPassport", "Xem ảnh đã tải")}
                                          </a>
                                          <p className="text-[10px] text-slate-400 font-semibold uppercase font-sans">{t("landing.bookings.addParticipantsPage.uploaded", "ĐÃ TẢI LÊN")}</p>
                                        </div>
                                        {!isFieldsDisabled && (
                                          <label className="cursor-pointer px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-[10px] font-extrabold rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.98] shrink-0 select-none font-sans">
                                            {t("landing.bookings.addParticipantsPage.changeImage", "Đổi ảnh")}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                              if (e.target.files?.[0]) handleFileUpload(p.id, "passportFileUrl", e.target.files[0]);
                                            }} />
                                          </label>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="relative">
                                        <label className={`group/upload cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-slate-50/50 ${
                                          uploadingFiles[`${p.id}-passportFileUrl`] || isFieldsDisabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
                                        }`}>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              if (e.target.files?.[0]) handleFileUpload(p.id, "passportFileUrl", e.target.files[0]);
                                            }}
                                            disabled={uploadingFiles[`${p.id}-passportFileUrl`] || isFieldsDisabled}
                                            className="hidden"
                                          />
                                          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 group-hover/upload:scale-105 transition-transform duration-500">
                                            <UploadSimple weight="bold" className="size-5 text-slate-400" />
                                          </div>
                                          <span className="text-xs font-bold text-slate-700 font-sans">{t("landing.bookings.addParticipantsPage.uploadPassport", "Tải ảnh mặt Passport")}</span>
                                          <span className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider font-sans">PNG, JPG, JPEG</span>
                                        </label>
                                      </div>
                                    )}
                                    {uploadingFiles[`${p.id}-passportFileUrl`] && (
                                      <span className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-wider pl-1 font-sans">
                                        <Spinner size={12} className="animate-spin"/> {t("landing.bookings.addParticipantsPage.uploadingStatus", "Đang tải...")}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {p.visaMode === "needs_support" && (
                                  <div className="mt-2 bg-amber-50/50 rounded-xl p-4 border border-amber-200/50 text-xs text-amber-900 leading-relaxed font-semibold font-sans">
                                    <div className="flex items-center gap-1.5 mb-1 text-amber-700">
                                      <Info weight="fill" className="size-4 shrink-0" />
                                      <span>{t("landing.bookings.addParticipantsPage.visaSupportRequest", "Yêu cầu hỗ trợ làm visa")}</span>
                                    </div>
                                    {t("landing.bookings.addParticipantsPage.visaSupportExplanation", "Hệ thống sẽ dùng thông tin passport trên để tạo yêu cầu hỗ trợ. Operator sẽ báo phí dịch vụ sau.")}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* If visa is not required, render original Block 1 as a normal grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">{t("landing.bookings.addParticipantsPage.fullName", "Full Name")}</label>
                            <input
                              type="text"
                              value={p.fullName}
                              onChange={(e) => updateParticipant(p.id, "fullName", e.target.value)}
                              placeholder={t("landing.bookings.addParticipantsPage.fullNamePlaceholder", "As shown on passport")}
                              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900"
                            />
                            {index === 0 && p.isNew && bookerName && p.fullName === bookerName && (
                              <p className="text-[10px] text-slate-400 mt-1 font-sans">{t("landing.bookings.addParticipantsPage.prefilledNote", "Tự điền từ thông tin đặt — chỉnh nếu khách khác.")}</p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">
                              {t("landing.bookings.addParticipantsPage.dateOfBirth")}
                            </label>
                            <DobSelector
                              value={p.dob}
                              onChange={(val) => handleDobChange(p.id, val)}
                              t={t}
                              disabled={rowStatus[p.id] === "saving"}
                            />
                            {p.dob && (() => {
                               const age = getAgeFromDob(p.dob);
                               if (age === null) return null;
                               const isMismatch = p.designatedType && p.participantType !== p.designatedType;
                               return (
                                 <div className="flex flex-col gap-1.5 mt-1">
                                   <span className={`text-[11px] font-bold flex items-center gap-1.5 font-sans ${isMismatch ? "text-amber-600" : "text-emerald-600"}`}>
                                     {isMismatch ? (
                                       <WarningCircle weight="fill" className="size-3.5 text-amber-500" />
                                     ) : (
                                       <CheckCircle weight="fill" className="size-3.5 text-emerald-600" />
                                     )}
                                     {age} {t("landing.bookings.addParticipantsPage.yearsOld")} — {p.participantType === "Adult" ? t("landing.bookings.addParticipantsPage.adult") : p.participantType === "Child" ? t("landing.bookings.addParticipantsPage.child") : t("landing.bookings.addParticipantsPage.infant")}
                                   </span>
                                   {isMismatch && (
                                     <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100/65 px-2 py-1 rounded-lg leading-normal font-sans">
                                       {t("landing.bookings.addParticipantsPage.cardTypeMismatchWarning", {
                                         inferred: t("landing.bookings.addParticipantsPage." + p.participantType.toLowerCase()),
                                         designated: t("landing.bookings.addParticipantsPage." + (p.designatedType || "adult").toLowerCase())
                                       })}
                                     </span>
                                   )}
                                 </div>
                               );
                             })()}
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">{t("landing.bookings.addParticipantsPage.gender", "Gender")}</label>
                            <select
                              value={p.gender}
                              onChange={(e) => updateParticipant(p.id, "gender", Number(e.target.value))}
                              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900"
                            >
                              <option value={0}>{t("landing.bookings.addParticipantsPage.male", "Male")}</option>
                              <option value={1}>{t("landing.bookings.addParticipantsPage.female", "Female")}</option>
                              <option value={2}>{t("landing.bookings.addParticipantsPage.otherGender", "Other")}</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">{t("landing.bookings.addParticipantsPage.currentNationality", "Quốc tịch hiện tại")}</label>
                            <input
                              type="text"
                              value={p.nationality}
                              maxLength={3}
                              onChange={(e) => updateNationality(p.id, "guest", e.target.value.toUpperCase())}
                              placeholder={t("landing.bookings.addParticipantsPage.nationalityPlaceholder", "VN, US, JP...")}
                              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900"
                            />
                          </div>

                          <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">{t("landing.bookings.addParticipantsPage.passengerType", "Phân loại hành khách")}</label>
                            <div className="flex p-1 rounded-2xl bg-slate-100/80 border border-slate-200/50 w-full relative">
                              {["Adult", "Child", "Infant"].map((type) => {
                                const isActive = p.participantType === type;
                                const labels: Record<string, string> = {
                                  Adult: t("landing.bookings.addParticipantsPage.adultLabel", "Người lớn (≥12t)"),
                                  Child: t("landing.bookings.addParticipantsPage.childLabel", "Trẻ em (2-11t)"),
                                  Infant: t("landing.bookings.addParticipantsPage.infantLabel", "Em bé (<2t)")
                                };
                                const activeClass = type === "Adult" 
                                  ? "bg-slate-900 text-white shadow-sm" 
                                  : type === "Child" 
                                    ? "bg-indigo-600 text-white shadow-sm" 
                                    : "bg-emerald-600 text-white shadow-sm";
                                return (
                                  <div
                                    key={type}
                                    className={`flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 select-none font-sans ${
                                      isActive 
                                        ? activeClass 
                                        : "text-slate-400 opacity-60"
                                    }`}
                                  >
                                    {labels[type]}
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider pl-1 font-sans font-medium">Phân loại tự động cập nhật theo ngày sinh</span>
                          </div>
                        </div>
                      )}

                      {/* Block 2: Visa Selection blocks - Beautiful interactive options */}
                      {isVisaActionable(p) && (
                        <div className="mt-4 pt-6 border-t border-slate-100 border-dashed">
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 font-sans">{t("landing.bookings.addParticipantsPage.visaStatusHeader", "Tình trạng visa")}</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => updateParticipant(p.id, "visaMode", "has_visa")}
                              className={`group/btn flex items-start gap-3 p-5 rounded-3xl border-2 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                p.visaMode === "has_visa"
                                  ? "border-slate-950 bg-slate-900 text-white shadow-[0_12px_24px_-10px_rgba(15,23,42,0.15)]"
                                  : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/30 text-slate-800"
                              }`}
                            >
                              <div className={`center size-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover/btn:scale-105 ${
                                p.visaMode === "has_visa" ? "bg-white/10" : "bg-slate-50 border border-slate-200"
                              }`}>
                                <IdentificationCard weight="bold" className="size-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm font-sans">{t("landing.bookings.addParticipantsPage.hasVisaTitle", "Đã có visa")}</p>
                                <p className={`text-[11px] mt-0.5 font-sans ${p.visaMode === "has_visa" ? "text-slate-300" : "text-slate-400"}`}>
                                  {t("landing.bookings.addParticipantsPage.hasVisaSub", "Tự nhập passport + file visa")}
                                </p>
                              </div>
                            </motion.button>

                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => updateParticipant(p.id, "visaMode", "needs_support")}
                              className={`group/btn flex items-start gap-3 p-5 rounded-3xl border-2 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                                p.visaMode === "needs_support"
                                  ? "border-amber-600 bg-amber-50 text-amber-950 shadow-[0_12px_24px_-10px_rgba(217,119,6,0.15)]"
                                  : "border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/5 text-slate-800"
                              }`}
                            >
                              <div className={`center size-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover/btn:scale-105 ${
                                p.visaMode === "needs_support" ? "bg-amber-100/80" : "bg-slate-50 border border-slate-200"
                              }`}>
                                <HandHeart weight="bold" className={`size-5 ${p.visaMode === "needs_support" ? "text-amber-700" : "text-slate-500"}`} />
                              </div>
                              <div>
                                <p className="font-bold text-sm font-sans">{t("landing.bookings.addParticipantsPage.needsVisaSupportTitle", "Cần hệ thống hỗ trợ")}</p>
                                <p className={`text-[11px] mt-0.5 font-sans ${p.visaMode === "needs_support" ? "text-amber-800/80" : "text-slate-400"}`}>
                                  {t("landing.bookings.addParticipantsPage.needsVisaSupportSub", "Yêu cầu làm visa (có tính phí dịch vụ)")}
                                </p>
                              </div>
                            </motion.button>

                          </div>

                          {/* Merged Visa fields inside Card 1 */}
                          {p.visaMode === "has_visa" && (
                            <div className="mt-6 pt-6 border-t border-slate-200 border-dashed flex flex-col gap-4">
                              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 font-sans">
                                {t("landing.bookings.addParticipantsPage.visaHeader", { index: index + 1 })}
                              </h4>

                              <div className="w-full">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5 font-sans">{t("landing.bookings.addParticipantsPage.visaFileImageLabel", "Ảnh File Visa (tùy chọn)")}</label>
                                  {p.visaFileUrl ? (
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]">
                                      <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                        <File className="size-5 text-slate-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <a href={p.visaFileUrl} target="_blank" rel="noreferrer" className="text-slate-900 hover:text-slate-700 text-xs font-bold truncate block hover:underline font-sans">
                                          {t("landing.bookings.addParticipantsPage.viewVisa", "Xem visa đã tải")}
                                        </a>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase font-sans">{t("landing.bookings.addParticipantsPage.uploaded", "ĐÃ TẢI LÊN")}</p>
                                      </div>
                                      {!isFieldsDisabled && !p.hasVisaApp && (
                                        <label className="cursor-pointer px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-[10px] font-extrabold rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.98] shrink-0 select-none font-sans">
                                          {t("landing.bookings.addParticipantsPage.changeImage", "Đổi ảnh")}
                                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                            if (e.target.files?.[0]) handleFileUpload(p.id, "visaFileUrl", e.target.files[0]);
                                          }} />
                                        </label>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <label className={`group/upload cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-slate-50/50 ${
                                        uploadingFiles[`${p.id}-visaFileUrl`] || isFieldsDisabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
                                      }`}>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            if (e.target.files?.[0]) handleFileUpload(p.id, "visaFileUrl", e.target.files[0]);
                                          }}
                                          disabled={uploadingFiles[`${p.id}-visaFileUrl`] || isFieldsDisabled}
                                          className="hidden"
                                        />
                                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 group-hover/upload:scale-105 transition-transform duration-500">
                                          <UploadSimple weight="bold" className="size-5 text-slate-400" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 font-sans">{t("landing.bookings.addParticipantsPage.uploadVisa", "Tải ảnh File Visa")}</span>
                                        <span className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider font-sans">PNG, JPG, JPEG</span>
                                      </label>
                                    </div>
                                  )}
                                  {uploadingFiles[`${p.id}-visaFileUrl`] && (
                                    <span className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-wider pl-1 font-sans">
                                      <Spinner size={12} className="animate-spin"/> {t("landing.bookings.addParticipantsPage.uploadingStatus", "Đang tải...")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                      {/* Individual card save log/error status message panels */}
                      {rowStatus[p.id] && rowStatus[p.id] !== "idle" && (
                        <div className="mt-4 pt-6 border-t border-slate-100 border-dashed">
                          <AnimatePresence mode="wait">
                            {rowStatus[p.id] === "saving" && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 font-bold text-xs w-fit font-sans"
                              >
                                <Spinner className="animate-spin size-4 text-slate-400" />
                                {t("landing.bookings.addParticipantsPage.savingInfo", "Đang lưu thông tin...")}
                              </motion.div>
                            )}
                            {rowStatus[p.id] === "saved" && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 font-bold text-xs w-fit font-sans"
                              >
                                <CheckCircle weight="fill" className="size-4 text-emerald-600" />
                                {t("landing.bookings.addParticipantsPage.savedSuccess", "Đã lưu thành công")}
                              </motion.div>
                            )}
                            {rowStatus[p.id] === "error" && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col gap-2 font-sans"
                              >
                                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 text-red-800 rounded-2xl border border-red-200 font-bold text-xs w-fit">
                                  <WarningCircle weight="fill" className="size-4 text-red-600" />
                                  {t("landing.bookings.addParticipantsPage.saveFailed", "Lưu thất bại")}
                                </div>
                                {rowError[p.id] && (
                                  <p className="text-[11px] text-red-600 font-extrabold ml-1 leading-snug max-w-[50ch]">
                                    {t("landing.bookings.addParticipantsPage.errorDetailPrefix", "Chi tiết:")} {rowError[p.id]}
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                    </div>
                  </motion.div>


                </React.Fragment>
              );
            })}
            </motion.div>

            {/* Bottom Stream CTA Buttons */}
            <div className="mt-12 flex justify-end items-center gap-4 border-t border-slate-200/50 pt-8">
              <Link
                href={`/bookings/${bookingId}`}
                className="px-6 py-3 rounded-full font-bold text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                {t("landing.bookings.addParticipantsPage.cancel", "Hủy bỏ")}
              </Link>
              
              <AnimatePresence>
                {Object.values(rowStatus).some(status => status === "error") && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="group/err flex items-center gap-3 rounded-full bg-amber-600 pl-6 pr-2.5 py-2.5 text-sm font-bold text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-amber-700 shadow-[0_12px_24px_-10px_rgba(217,119,6,0.2)] hover:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <span>{t("landing.bookings.addParticipantsPage.retryErrors", "Thử lại các dòng lỗi")}</span>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 transition-transform duration-500 group-hover/err:translate-x-0.5">
                      {isSaving ? (
                        <Spinner className="animate-spin size-4 text-white" />
                      ) : (
                        <WarningCircle weight="bold" className="size-4 text-white" />
                      )}
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className="group/save flex items-center gap-3 rounded-full bg-slate-900 pl-6 pr-2.5 py-2.5 text-sm font-bold text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-slate-800 shadow-[0_12px_24px_-10px_rgba(15,23,42,0.2)] hover:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{isSaving ? t("landing.bookings.addParticipantsPage.saving", "Đang lưu...") : t("landing.bookings.addParticipantsPage.saveBtn", "Lưu thông tin hành khách")}</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 transition-transform duration-500 group-hover/save:translate-x-0.5">
                  {isSaving ? (
                    <Spinner className="animate-spin size-4 text-white" />
                  ) : (
                    <ArrowRight weight="bold" className="size-4 text-white" />
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Unlock Confirmation Modal */}
      <AnimatePresence>
        {confirmUnlockId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full border border-slate-100 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <WarningCircle weight="bold" className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {t("participantReview.editWarning.title", "Hành khách này đã được duyệt")}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                    {t("participantReview.editWarning.body", "Chỉnh sửa sẽ huỷ trạng thái duyệt và phải chờ Tour Operator duyệt lại.")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmUnlockId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {t("participantReview.editWarning.cancel", "Huỷ bỏ")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmUnlockId) {
                      setUnlockedApprovedIds(prev => [...prev, confirmUnlockId]);
                      setConfirmUnlockId(null);
                    }
                  }}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {t("participantReview.editWarning.continue", "Tiếp tục sửa")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
