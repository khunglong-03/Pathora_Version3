"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, WarningCircle, CheckCircle, Spinner, IdentificationCard, HandHeart, Info, File, UploadSimple } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
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
}

const blankVisaFields = (defaults?: { nationality?: string; minReturnDate?: string }): Pick<
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
  destinationCountry: "",
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

export function CustomerAddParticipants({ bookingId }: { bookingId: string }) {
  const router = useRouter();
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

  const isVisaActionable = (p: Participant): boolean => {
    if (!isVisaRequired) return false;
    return p.isNew === true || !p.documentUploaded || !p.hasVisaApp;
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

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
          documentUploaded: hasPassport,
          hasVisaApp,
          isNew: false,
          ...blankVisaFields({ nationality: guestNationality, minReturnDate: returnDateIso }),
          visaMode: presetMode,
          nationalityOverride: guestNationality !== passportNationalityVal,
          passportNumber: p.passport?.passportNumber ?? "",
          passportNationality: passportNationalityVal,
          passportIssuedAt: p.passport?.issuedAt ? p.passport.issuedAt.split("T")[0] : "",
          passportExpiresAt: p.passport?.expiresAt ? p.passport.expiresAt.split("T")[0] : "",
          passportFileUrl: p.passport?.fileUrl ?? "",
          destinationCountry: latestApp?.destinationCountry ?? "",
          minReturnDate: latestApp?.minReturnDate ? latestApp.minReturnDate.split("T")[0] : returnDateIso,
          visaFileUrl: latestApp?.visaFileUrl ?? "",
          passportId: p.passport?.passportId ?? p.passport?.id ?? "",
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
          documentUploaded: false,
          hasVisaApp: false,
          isNew: true,
          ...blankVisaFields({ nationality: "VN", minReturnDate: returnDateIso }),
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
      toast.error("Failed to load data");
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
      toast.success("Tải ảnh lên thành công");
    } catch (err) {
      console.error(err);
      toast.error("Tải ảnh lên thất bại");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [`${participantId}-${field}`]: false }));
    }
  };

  const validateRow = (p: Participant): string | null => {
    if (!p.fullName.trim()) return `Hành khách thiếu họ tên.`;
    if (!p.dob) return `${p.fullName || "Hành khách"}: vui lòng nhập ngày sinh.`;
    if (new Date(p.dob) > new Date()) {
      return `${p.fullName}: ngày sinh không thể ở tương lai.`;
    }
    if (!isVisaActionable(p)) return null;
    if (!p.visaMode) return `${p.fullName || "Hành khách"}: vui lòng chọn tình trạng visa.`;
    if (p.visaMode) {
      if (p.visaMode === "has_visa") {
        if (!p.passportNumber.trim()) return `${p.fullName}: thiếu số passport.`;
        if (!p.passportNationality.trim()) return `${p.fullName}: thiếu quốc tịch passport.`;
        if (!p.passportIssuedAt) return `${p.fullName}: thiếu ngày cấp passport.`;
        if (!p.passportExpiresAt) return `${p.fullName}: thiếu ngày hết hạn passport.`;
        if (tourReturnDate && new Date(p.passportExpiresAt) < new Date(tourReturnDate)) {
          return `${p.fullName}: passport phải còn hạn sau ngày kết thúc tour (${tourReturnDate}).`;
        }
      } else if (p.visaMode === "needs_support") {
        if (!p.passportFileUrl.trim()) return `${p.fullName}: thiếu file ảnh passport. Để hệ thống hỗ trợ, bạn cần upload ảnh mặt passport.`;
      }
    }
    if (p.visaMode === "has_visa") {
      if (!p.destinationCountry.trim()) return `${p.fullName}: thiếu quốc gia đến.`;
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
      mismatches.push(`${currentCounts.Adult}/${requiredCounts.Adult} Người lớn`);
    }
    if (currentCounts.Child !== requiredCounts.Child) {
      mismatches.push(`${currentCounts.Child}/${requiredCounts.Child} Trẻ em`);
    }
    if (currentCounts.Infant !== requiredCounts.Infant) {
      mismatches.push(`${currentCounts.Infant}/${requiredCounts.Infant} Em bé`);
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
      toast.error(`Cơ cấu hành khách không khớp với đăng ký (${mismatch}). Vui lòng điều chỉnh lại ngày sinh.`);
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
      toast.success("Lưu thông tin hành khách thành công.");
      router.push(`/bookings/${bookingId}#visa`);
    } else {
      toast.error("Có lỗi xảy ra khi lưu một số hành khách. Vui lòng kiểm tra lại.");
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
            Back to Booking
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">
          
          {/* STICKY SIDEBAR (Left Column) - Premium spacing & layout */}
          <div className="lg:sticky lg:top-24 flex flex-col gap-6">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900 leading-tight">
                Manage Participants
              </h1>
              <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed max-w-[32ch]">
                Cung cấp thông tin hành khách tham gia chuyến đi của booking {bookingId}.
              </p>
            </div>

            {/* Visual Progress Dashboard Bento Widget */}
            <div className="p-1.5 rounded-[2.5rem] bg-slate-100 border border-slate-200/50 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.02)]">
              <div className="bg-white rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-6">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Status Overview</h2>
                  <div className="flex flex-col gap-4">
                    
                    {/* Visual grid status list */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-slate-900 block"></span>
                        <span className="text-sm font-bold text-slate-700">Total Guests</span>
                      </div>
                      <span className="font-mono text-base font-bold text-slate-900">{totalCount}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-emerald-500 block"></span>
                        <span className="text-sm font-bold text-slate-700">Saved Successfully</span>
                      </div>
                      <span className="font-mono text-base font-bold text-slate-900">{savedCount}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-amber-500 block"></span>
                        <span className="text-sm font-bold text-slate-700">Pending Changes</span>
                      </div>
                      <span className="font-mono text-base font-bold text-slate-900">{pendingCount}</span>
                    </div>

                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-red-500 block"></span>
                        <span className="text-sm font-bold text-slate-700">Failed / Errors</span>
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
                    <span>PROGRESS</span>
                    <span>{Math.round(totalCount ? (savedCount / totalCount) * 100 : 0)}%</span>
                  </div>
                </div>

                {/* Passenger Configuration Widget */}
                <div className="border-t border-slate-100 pt-6 font-sans">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 font-sans">Cơ cấu hành khách</h2>
                  <div className="flex flex-col gap-3 font-sans">
                    <div className="flex items-center justify-between text-xs font-bold font-sans">
                      <span className="text-slate-500">Người lớn (≥ 12t)</span>
                      <span className={`text-[11px] font-bold transition-colors ${
                        participants.filter(p => p.participantType === "Adult").length === bookingPax.adults 
                          ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md" 
                          : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"
                      }`}>
                        {participants.filter(p => p.participantType === "Adult").length} / {bookingPax.adults}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold font-sans">
                      <span className="text-slate-500">Trẻ em (2 - 11t)</span>
                      <span className={`text-[11px] font-bold transition-colors ${
                        participants.filter(p => p.participantType === "Child").length === bookingPax.children 
                          ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md" 
                          : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"
                      }`}>
                        {participants.filter(p => p.participantType === "Child").length} / {bookingPax.children}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold font-sans">
                      <span className="text-slate-500">Em bé (&lt; 2t)</span>
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
                        Chưa khớp cơ cấu đăng ký! Hãy kiểm tra lại ngày sinh của các hành khách.
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
                      <span className="text-xs font-bold uppercase tracking-wider">Visa Requirement Note</span>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-white mb-2">Tour này yêu cầu Visa</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Mỗi hành khách: nếu đã tự có visa, vui lòng nhập số passport và cập nhật hình ảnh. Nếu chưa có visa, hãy chọn &quot;Cần hệ thống hỗ trợ&quot; để nhân viên của chúng tôi chuẩn bị các bước thủ tục cho bạn.
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
              {participants.map((p, index) => (
                <React.Fragment key={p.id}>
                  {/* Card 1: Basic details and Passport if isVisaRequired */}
                  <motion.div
                    variants={cardVariants}
                    className="p-1.5 rounded-[2.5rem] bg-slate-200/50 border border-slate-300/30 shadow-[0_15px_30px_-10px_rgba(28,25,23,0.03)] hover:shadow-[0_25px_45px_-15px_rgba(28,25,23,0.06)] transition-all duration-750 ease-[cubic-bezier(0.32,0.72,0,1)] relative overflow-hidden"
                  >
                    <div className="bg-white rounded-[calc(2.5rem-0.375rem)] p-8 md:p-10 relative overflow-hidden border border-slate-100/50 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                      
                      {/* Decorative color border on side matching status */}
                      <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                        rowStatus[p.id] === "saved" ? "bg-emerald-500" :
                        rowStatus[p.id] === "error" ? "bg-red-500" :
                        rowStatus[p.id] === "saving" ? "bg-slate-400" :
                        "bg-slate-200/60"
                      }`} />

                      {/* Title & Top indicators */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold tracking-tight text-slate-900">Guest {index + 1}</h3>
                        
                        <div className="flex items-center gap-2">
                          <AnimatePresence mode="wait">
                            {rowStatus[p.id] === "saving" && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-extrabold rounded-full border border-slate-200"
                              >
                                <Spinner className="animate-spin size-3.5" />
                                Đang lưu...
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
                                Đã lưu
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
                                Lỗi
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {isVisaRequired ? (
                        <div className="border border-slate-200/60 rounded-3xl p-6 md:p-8 bg-slate-50/30">
                          <h4 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 font-sans">
                            <IdentificationCard weight="fill" className="size-5 text-slate-700" />
                            Thông tin hành khách & Hộ chiếu
                          </h4>

                          {/* Basic user details grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Full Name</label>
                              <input
                                type="text"
                                value={p.fullName}
                                onChange={(e) => updateParticipant(p.id, "fullName", e.target.value)}
                                placeholder="As shown on passport"
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900"
                              />
                              {index === 0 && p.isNew && bookerName && p.fullName === bookerName && (
                                <p className="text-[10px] text-slate-400 mt-1 font-sans">Tự điền từ thông tin đặt — chỉnh nếu khách khác.</p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">
                                Ngày sinh
                              </label>
                              <input
                                type="date"
                                value={p.dob}
                                min="1900-01-01"
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(e) => handleDobChange(p.id, e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900 font-sans"
                              />
                              {p.dob && (() => {
                                const age = getAgeFromDob(p.dob);
                                if (age === null) return null;
                                return (
                                  <span className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1.5 font-sans">
                                    <CheckCircle weight="fill" className="size-3.5 text-emerald-600" />
                                    {age} tuổi — {p.participantType === "Adult" ? "Người lớn" : p.participantType === "Child" ? "Trẻ em" : "Em bé"}
                                  </span>
                                );
                              })()}
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Gender</label>
                              <select
                                value={p.gender}
                                onChange={(e) => updateParticipant(p.id, "gender", Number(e.target.value))}
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900"
                              >
                                <option value={0}>Male</option>
                                <option value={1}>Female</option>
                                <option value={2}>Other</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Quốc tịch hiện tại</label>
                              <input
                                type="text"
                                value={p.nationality}
                                maxLength={3}
                                onChange={(e) => updateNationality(p.id, "guest", e.target.value.toUpperCase())}
                                placeholder="VN, US, JP..."
                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900"
                              />
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Phân loại hành khách</label>
                              <div className="flex p-1 rounded-2xl bg-slate-100/80 border border-slate-200/50 w-full relative">
                                {["Adult", "Child", "Infant"].map((type) => {
                                  const isActive = p.participantType === type;
                                  const labels: Record<string, string> = {
                                    Adult: "Người lớn (≥12t)",
                                    Child: "Trẻ em (2-11t)",
                                    Infant: "Em bé (<2t)"
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

                          {/* Block 3: Passport (renders only when visaMode is set) */}
                          {p.visaMode && (
                            <div>
                              {/* Divider between Block 1 and Block 3 */}
                              <div className="border-t border-slate-200 my-6" />

                              <div className="flex flex-col gap-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Thông tin passport</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {p.visaMode === "has_visa" && (
                                    <>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 font-sans">Passport Number</label>
                                        <input
                                          type="text"
                                          value={p.passportNumber}
                                          onChange={(e) => updateParticipant(p.id, "passportNumber", e.target.value)}
                                          placeholder="C1234567"
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 font-sans">Quốc gia cấp hộ chiếu</label>
                                        <input
                                          type="text"
                                          maxLength={3}
                                          value={p.passportNationality}
                                          onChange={(e) => updateNationality(p.id, "passport", e.target.value.toUpperCase())}
                                          placeholder="VN"
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans"
                                        />
                                        {/* Override Checkbox UI (Task 1.6) */}
                                        <label className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-sans select-none">
                                          <input
                                            type="checkbox"
                                            checked={p.nationalityOverride}
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
                                            className="rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                                          />
                                          Hộ chiếu cấp ở quốc gia khác với quốc tịch hiện tại
                                        </label>
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 font-sans">Issued Date</label>
                                        <input
                                          type="date"
                                          value={p.passportIssuedAt}
                                          onChange={(e) => updateParticipant(p.id, "passportIssuedAt", e.target.value)}
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 font-sans">
                                          Expires Date {tourReturnDate && <span className="font-semibold text-slate-400 text-[10px] tracking-tight">(sau {tourReturnDate})</span>}
                                        </label>
                                        <input
                                          type="date"
                                          value={p.passportExpiresAt}
                                          onChange={(e) => updateParticipant(p.id, "passportExpiresAt", e.target.value)}
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans"
                                        />
                                      </div>
                                    </>
                                  )}

                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 block mb-1.5 font-sans">
                                      {p.visaMode === "needs_support" ? "Upload ảnh mặt Passport (Bắt buộc)" : "Ảnh Passport (tùy chọn)"}
                                    </label>
                                    {p.passportFileUrl ? (
                                      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]">
                                        <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                          <File className="size-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <a href={p.passportFileUrl} target="_blank" rel="noreferrer" className="text-slate-900 hover:text-slate-700 text-xs font-bold truncate block hover:underline font-sans">
                                            Xem ảnh đã tải
                                          </a>
                                          <p className="text-[10px] text-slate-400 font-semibold uppercase font-sans">ĐÃ TẢI LÊN</p>
                                        </div>
                                        <label className="cursor-pointer px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-[10px] font-extrabold rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.98] shrink-0 select-none font-sans">
                                          Đổi ảnh
                                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                            if (e.target.files?.[0]) handleFileUpload(p.id, "passportFileUrl", e.target.files[0]);
                                          }} />
                                        </label>
                                      </div>
                                    ) : (
                                      <div className="relative">
                                        <label className={`group/upload cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-slate-50/50 ${
                                          uploadingFiles[`${p.id}-passportFileUrl`] ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
                                        }`}>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              if (e.target.files?.[0]) handleFileUpload(p.id, "passportFileUrl", e.target.files[0]);
                                            }}
                                            disabled={uploadingFiles[`${p.id}-passportFileUrl`]}
                                            className="hidden"
                                          />
                                          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 group-hover/upload:scale-105 transition-transform duration-500">
                                            <UploadSimple weight="bold" className="size-5 text-slate-400" />
                                          </div>
                                          <span className="text-xs font-bold text-slate-700 font-sans">Tải ảnh mặt Passport</span>
                                          <span className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider font-sans">PNG, JPG, JPEG</span>
                                        </label>
                                      </div>
                                    )}
                                    {uploadingFiles[`${p.id}-passportFileUrl`] && (
                                      <span className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-wider pl-1 font-sans">
                                        <Spinner size={12} className="animate-spin"/> Đang tải...
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {p.visaMode === "needs_support" && (
                                  <div className="mt-2 bg-amber-50/50 rounded-xl p-4 border border-amber-200/50 text-xs text-amber-900 leading-relaxed font-semibold font-sans">
                                    <div className="flex items-center gap-1.5 mb-1 text-amber-700">
                                      <Info weight="fill" className="size-4 shrink-0" />
                                      <span>Yêu cầu hỗ trợ làm visa</span>
                                    </div>
                                    Hệ thống sẽ dùng thông tin passport trên để tạo yêu cầu hỗ trợ. Operator sẽ báo phí dịch vụ sau.
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
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Full Name</label>
                            <input
                              type="text"
                              value={p.fullName}
                              onChange={(e) => updateParticipant(p.id, "fullName", e.target.value)}
                              placeholder="As shown on passport"
                              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900"
                            />
                            {index === 0 && p.isNew && bookerName && p.fullName === bookerName && (
                              <p className="text-[10px] text-slate-400 mt-1 font-sans">Tự điền từ thông tin đặt — chỉnh nếu khách khác.</p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">
                              Ngày sinh
                            </label>
                            <input
                              type="date"
                              value={p.dob}
                              min="1900-01-01"
                              max={new Date().toISOString().split("T")[0]}
                              onChange={(e) => handleDobChange(p.id, e.target.value)}
                              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900 font-sans"
                            />
                            {p.dob && (() => {
                              const age = getAgeFromDob(p.dob);
                              if (age === null) return null;
                              return (
                                <span className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1.5 font-sans">
                                  <CheckCircle weight="fill" className="size-3.5 text-emerald-600" />
                                  {age} tuổi — {p.participantType === "Adult" ? "Người lớn" : p.participantType === "Child" ? "Trẻ em" : "Em bé"}
                                </span>
                              );
                            })()}
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Gender</label>
                            <select
                              value={p.gender}
                              onChange={(e) => updateParticipant(p.id, "gender", Number(e.target.value))}
                              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900"
                            >
                              <option value={0}>Male</option>
                              <option value={1}>Female</option>
                              <option value={2}>Other</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Quốc tịch hiện tại</label>
                            <input
                              type="text"
                              value={p.nationality}
                              maxLength={3}
                              onChange={(e) => updateNationality(p.id, "guest", e.target.value.toUpperCase())}
                              placeholder="VN, US, JP..."
                              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none font-semibold text-slate-900"
                            />
                          </div>

                          <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Phân loại hành khách</label>
                            <div className="flex p-1 rounded-2xl bg-slate-100/80 border border-slate-200/50 w-full relative">
                              {["Adult", "Child", "Infant"].map((type) => {
                                const isActive = p.participantType === type;
                                const labels: Record<string, string> = {
                                  Adult: "Người lớn (≥12t)",
                                  Child: "Trẻ em (2-11t)",
                                  Infant: "Em bé (<2t)"
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
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 font-sans">Tình trạng visa</h4>
                          
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
                                <p className="font-bold text-sm font-sans">Đã có visa</p>
                                <p className={`text-[11px] mt-0.5 font-sans ${p.visaMode === "has_visa" ? "text-slate-300" : "text-slate-400"}`}>
                                  Tự nhập passport + file visa
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
                                <p className="font-bold text-sm font-sans">Cần hệ thống hỗ trợ</p>
                                <p className={`text-[11px] mt-0.5 font-sans ${p.visaMode === "needs_support" ? "text-amber-800/80" : "text-slate-400"}`}>
                                  Yêu cầu làm visa (có tính phí dịch vụ)
                                </p>
                              </div>
                            </motion.button>

                          </div>
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
                                Đang lưu thông tin...
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
                                Đã lưu thành công
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
                                  Lưu thất bại
                                </div>
                                {rowError[p.id] && (
                                  <p className="text-[11px] text-red-600 font-extrabold ml-1 leading-snug max-w-[50ch]">
                                    Chi tiết: {rowError[p.id]}
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                    </div>
                  </motion.div>

                  {/* Card 2: Visa Application (Block 4) rendered as a completely separate card */}
                  {isVisaRequired && p.visaMode === "has_visa" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      className="p-1.5 rounded-[2.5rem] bg-indigo-50/50 border border-indigo-150/40 shadow-[0_15px_30px_-10px_rgba(79,70,229,0.03)] hover:shadow-[0_25px_45px_-15px_rgba(79,70,229,0.06)] transition-all duration-750 ease-[cubic-bezier(0.32,0.72,0,1)] relative overflow-hidden"
                    >
                      <div className="bg-white rounded-[calc(2.5rem-0.375rem)] p-8 md:p-10 relative overflow-hidden border border-indigo-50/30 flex flex-col gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                        {/* Decorative border matching visa theme */}
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500" />

                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold tracking-tight text-slate-900 font-sans flex items-center gap-2">
                            <IdentificationCard weight="fill" className="size-5 text-indigo-500" />
                            Hồ sơ visa — Guest {index + 1}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-500 font-sans">Destination Country (ISO)</label>
                            <input
                              type="text"
                              maxLength={3}
                              value={p.destinationCountry}
                              onChange={(e) => updateParticipant(p.id, "destinationCountry", e.target.value.toUpperCase())}
                              placeholder="JP, US, KR..."
                              disabled={!p.isNew && p.hasVisaApp}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-500 font-sans">Min Return Date</label>
                            <input
                              type="date"
                              value={p.minReturnDate}
                              onChange={(e) => updateParticipant(p.id, "minReturnDate", e.target.value)}
                              disabled={!p.isNew && p.hasVisaApp}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-semibold text-slate-900 text-sm font-sans disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-500 block mb-1.5 font-sans">Ảnh File Visa (tùy chọn)</label>
                            {p.visaFileUrl ? (
                              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]">
                                <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                  <File className="size-5 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <a href={p.visaFileUrl} target="_blank" rel="noreferrer" className="text-slate-900 hover:text-slate-700 text-xs font-bold truncate block hover:underline font-sans">
                                    Xem visa đã tải
                                  </a>
                                  <p className="text-[10px] text-slate-400 font-semibold uppercase font-sans">ĐÃ TẢI LÊN</p>
                                </div>
                                <label className="cursor-pointer px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-[10px] font-extrabold rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.98] shrink-0 select-none font-sans">
                                  Đổi ảnh
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    if (e.target.files?.[0]) handleFileUpload(p.id, "visaFileUrl", e.target.files[0]);
                                  }} />
                                </label>
                              </div>
                            ) : (
                              <div className="relative">
                                <label className={`group/upload cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-slate-50/50 ${
                                  uploadingFiles[`${p.id}-visaFileUrl`] ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
                                }`}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) handleFileUpload(p.id, "visaFileUrl", e.target.files[0]);
                                    }}
                                    disabled={uploadingFiles[`${p.id}-visaFileUrl`]}
                                    className="hidden"
                                  />
                                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 group-hover/upload:scale-105 transition-transform duration-500">
                                    <UploadSimple weight="bold" className="size-5 text-slate-400" />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 font-sans">Tải ảnh File Visa</span>
                                  <span className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider font-sans">PNG, JPG, JPEG</span>
                                </label>
                              </div>
                            )}
                            {uploadingFiles[`${p.id}-visaFileUrl`] && (
                              <span className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-wider pl-1 font-sans">
                                <Spinner size={12} className="animate-spin"/> Đang tải...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </motion.div>

            {/* Bottom Stream CTA Buttons */}
            <div className="mt-12 flex justify-end items-center gap-4 border-t border-slate-200/50 pt-8">
              <Link
                href={`/bookings/${bookingId}`}
                className="px-6 py-3 rounded-full font-bold text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              >
                Hủy bỏ
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
                    <span>Thử lại các dòng lỗi</span>
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
                <span>{isSaving ? "Đang lưu..." : "Lưu thông tin hành khách"}</span>
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

    </div>
  );
}
