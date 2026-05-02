"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, UserCirclePlus, WarningCircle, CheckCircle, Trash, Spinner, IdentificationCard, HandHeart } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { bookingService } from "@/api/services/bookingService";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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

  // Visa intent for this participant
  visaMode: VisaMode;

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
});

export function CustomerAddParticipants({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [maxParticipants, setMaxParticipants] = useState<number>(0);
  const [isVisaRequired, setIsVisaRequired] = useState(false);
  const [tourReturnDate, setTourReturnDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [bookingId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [participantsData, bookingData] = await Promise.all([
        bookingService.getParticipants(bookingId),
        bookingService.getBookingDetail(bookingId)
      ]);

      const numAdult = bookingData?.numberAdult || 0;
      const numChild = bookingData?.numberChild || 0;
      const numInfant = bookingData?.numberInfant || 0;
      const totalGuests = numAdult + numChild + numInfant;
      setMaxParticipants(totalGuests);
      setIsVisaRequired(!!bookingData?.isVisaRequired);
      const returnDateRaw = (bookingData as any)?.returnDate ?? (bookingData as any)?.endDate;
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
        return {
          id: p.id || `existing-${Date.now()}-${existingSeq++}`,
          fullName: p.fullName,
          dob: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
          gender: typeof p.gender === "number" ? p.gender : 0,
          nationality: p.nationality || "VN",
          participantType: p.participantType || "Adult",
          documentUploaded: hasPassport,
          hasVisaApp,
          isNew: false,
          ...blankVisaFields({ nationality: p.nationality || "VN", minReturnDate: returnDateIso }),
          visaMode: presetMode,
          passportNumber: p.passport?.passportNumber ?? "",
          passportNationality: p.passport?.nationality ?? p.nationality ?? "VN",
          passportIssuedAt: p.passport?.issuedAt ? p.passport.issuedAt.split("T")[0] : "",
          passportExpiresAt: p.passport?.expiresAt ? p.passport.expiresAt.split("T")[0] : "",
          passportFileUrl: p.passport?.fileUrl ?? "",
          destinationCountry: latestApp?.destinationCountry ?? "",
          minReturnDate: latestApp?.minReturnDate ? latestApp.minReturnDate.split("T")[0] : returnDateIso,
          visaFileUrl: latestApp?.visaFileUrl ?? "",
        };
      });

      const remainingByType = {
        Adult: Math.max(0, numAdult - existing.filter(p => p.participantType === "Adult").length),
        Child: Math.max(0, numChild - existing.filter(p => p.participantType === "Child").length),
        Infant: Math.max(0, numInfant - existing.filter(p => p.participantType === "Infant").length),
      };

      const blanks: Participant[] = [];
      let seq = Date.now();
      const pushBlank = (type: string) => {
        blanks.push({
          id: `new-${seq++}`,
          fullName: "",
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
      if (merged.length === 0) {
        pushBlank("Adult");
        setParticipants(blanks);
      } else {
        setParticipants(merged);
      }
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

  const addParticipant = () => {
    if (participants.length >= maxParticipants && maxParticipants > 0) {
      toast.error(`You can only add up to ${maxParticipants} guests for this booking.`);
      return;
    }
    setParticipants(prev => [...prev, {
      id: `new-${Date.now()}`,
      fullName: "",
      dob: "",
      gender: 0,
      nationality: "VN",
      participantType: "Adult",
      documentUploaded: false,
      hasVisaApp: false,
      isNew: true,
      ...blankVisaFields({ nationality: "VN", minReturnDate: tourReturnDate }),
    }]);
  };

  const removeParticipant = async (id: string) => {
    const p = participants.find(x => x.id === id);
    if (!p) return;
    if (!p.isNew) {
      toast.error("Cannot remove an existing participant from this interface yet.");
      return;
    }
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const isVisaActionable = (p: Participant): boolean => {
    if (!isVisaRequired) return false;
    return p.isNew === true || !p.documentUploaded || !p.hasVisaApp;
  };

  const validateRow = (p: Participant): string | null => {
    if (!p.fullName.trim()) return `Hành khách thiếu họ tên.`;
    if (!isVisaActionable(p)) return null;
    if (!p.visaMode) return `${p.fullName || "Hành khách"}: vui lòng chọn tình trạng visa.`;
    if (p.visaMode) {
      if (!p.passportNumber.trim()) return `${p.fullName}: thiếu số passport.`;
      if (!p.passportNationality.trim()) return `${p.fullName}: thiếu quốc tịch passport.`;
      if (!p.passportIssuedAt) return `${p.fullName}: thiếu ngày cấp passport.`;
      if (!p.passportExpiresAt) return `${p.fullName}: thiếu ngày hết hạn passport.`;
      if (tourReturnDate && new Date(p.passportExpiresAt) < new Date(tourReturnDate)) {
        return `${p.fullName}: passport phải còn hạn sau ngày kết thúc tour (${tourReturnDate}).`;
      }
      if (!p.passportFileUrl.trim()) return `${p.fullName}: thiếu file passport.`;
    }
    if (p.visaMode === "has_visa") {
      if (!p.destinationCountry.trim()) return `${p.fullName}: thiếu quốc gia đến.`;
    }
    return null;
  };

  const handleSave = async () => {
    const rowsToProcess = participants;

    for (const p of rowsToProcess) {
      const err = validateRow(p);
      if (err) {
        toast.error(err);
        return;
      }
    }

    if (rowsToProcess.length === 0) {
      router.push(`/bookings/${bookingId}#visa`);
      return;
    }

    setIsSaving(true);
    try {
      for (const p of rowsToProcess) {
        let participantId: string | undefined = p.isNew ? undefined : p.id;

        if (p.isNew) {
          participantId = await bookingService.createParticipant(bookingId, {
            participantType: p.participantType || "Adult",
            fullName: p.fullName,
            dateOfBirth: p.dob ? new Date(p.dob).toISOString() : null,
            gender: p.gender,
            nationality: p.nationality || "VN",
          });
        } else {
          // Extract real UUID, removing "existing-123-0" fallback prefix if any. 
          // p.id might be a pure UUID if it came from DB, or something else. The DB returns pure UUIDs.
          const realId = p.id;
          await bookingService.updateParticipant(bookingId, realId, {
            participantId: realId,
            participantType: p.participantType || "Adult",
            fullName: p.fullName,
            dateOfBirth: p.dob ? new Date(p.dob).toISOString() : null,
            gender: p.gender,
            nationality: p.nationality || "VN",
          });
        }

        if (!isVisaRequired || !participantId) continue;

        if (p.visaMode) {
          await bookingService.upsertParticipantPassport(bookingId, participantId, {
            passportNumber: p.passportNumber,
            nationality: p.passportNationality,
            issuedAt: p.passportIssuedAt ? new Date(p.passportIssuedAt).toISOString() : null,
            expiresAt: p.passportExpiresAt ? new Date(p.passportExpiresAt).toISOString() : null,
            fileUrl: p.passportFileUrl || null,
          });

          if (p.visaMode === "has_visa") {
            if (!p.hasVisaApp) {
              await bookingService.submitVisaApplication(bookingId, {
                bookingParticipantId: participantId,
                destinationCountry: p.destinationCountry,
                minReturnDate: p.minReturnDate ? new Date(p.minReturnDate).toISOString() : undefined,
                visaFileUrl: p.visaFileUrl || undefined,
              });
            }
          } else if (p.visaMode === "needs_support") {
            if (!p.hasVisaApp) {
              await bookingService.requestVisaSupport(bookingId, participantId);
            }
          }
        }
      }
      toast.success("Lưu thông tin hành khách thành công.");
      router.push(`/bookings/${bookingId}#visa`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save participants");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <Spinner size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="pt-24 pb-12 bg-white border-b border-slate-200/50">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8">
          <Link
            href={`/bookings/${bookingId}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
          >
            <ArrowLeft weight="bold" className="size-4" />
            Back to Booking
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 leading-none"
              >
                Manage Participants
              </motion.h1>
              <p className="text-slate-500 mt-4 max-w-lg">
                Vui lòng cung cấp thông tin từng hành khách. Booking <span className="font-bold text-slate-900">{bookingId}</span>.
              </p>
            </div>
            <div className="shrink-0 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 text-center">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Guests</p>
              <p className="text-3xl font-bold text-slate-900">{participants.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-12">
        {isVisaRequired && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
            <WarningCircle weight="fill" className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 leading-relaxed">
              <p className="font-bold mb-1">Tour này yêu cầu visa</p>
              <p>
                Mỗi hành khách: nếu đã có visa → tự nhập passport + file visa. Nếu chưa có → chọn yêu cầu hệ thống hỗ trợ làm visa (có phí dịch vụ).
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence>
            {participants.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Guest {index + 1}</h3>
                  {p.isNew && (
                    <button
                      onClick={() => removeParticipant(p.id)}
                      className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors"
                      title="Remove Participant"
                    >
                      <Trash weight="bold" className="size-5" />
                    </button>
                  )}
                </div>

                {/* Basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={p.fullName}
                      
                      onChange={(e) => updateParticipant(p.id, "fullName", e.target.value)}
                      placeholder="As shown on passport"
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium "
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={p.dob}
                      
                      onChange={(e) => updateParticipant(p.id, "dob", e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium "
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                    <select
                      value={p.gender}
                      
                      onChange={(e) => updateParticipant(p.id, "gender", Number(e.target.value))}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium "
                    >
                      <option value={0}>Male</option>
                      <option value={1}>Female</option>
                      <option value={2}>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nationality (ISO code)</label>
                    <input
                      type="text"
                      value={p.nationality}
                      
                      maxLength={3}
                      onChange={(e) => updateParticipant(p.id, "nationality", e.target.value.toUpperCase())}
                      placeholder="VN, US, JP..."
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium "
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Participant Type</label>
                    <select
                      value={p.participantType}
                      
                      onChange={(e) => updateParticipant(p.id, "participantType", e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium "
                    >
                      <option value="Adult">Adult</option>
                      <option value="Child">Child</option>
                      <option value="Infant">Infant</option>
                    </select>
                  </div>
                </div>

                {/* Visa block — show when tour needs visa AND row is new OR existing without complete visa */}
                {isVisaActionable(p) && (
                  <div className="mt-8 pt-8 border-t border-slate-100 border-dashed">
                    <h4 className="text-base font-bold text-slate-900 mb-4">Tình trạng visa</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      <button
                        type="button"
                        onClick={() => updateParticipant(p.id, "visaMode", "has_visa")}
                        className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                          p.visaMode === "has_visa"
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <IdentificationCard weight="bold" className="size-6 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Đã có visa</p>
                          <p className={`text-xs ${p.visaMode === "has_visa" ? "text-white/80" : "text-slate-500"}`}>
                            Tự nhập passport + file visa
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateParticipant(p.id, "visaMode", "needs_support")}
                        className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                          p.visaMode === "needs_support"
                            ? "border-amber-600 bg-amber-50 text-amber-900"
                            : "border-slate-200 hover:border-amber-300"
                        }`}
                      >
                        <HandHeart weight="bold" className="size-6 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Cần hệ thống hỗ trợ</p>
                          <p className={`text-xs ${p.visaMode === "needs_support" ? "text-amber-800" : "text-slate-500"}`}>
                            Yêu cầu làm visa, có phí dịch vụ
                          </p>
                        </div>
                      </button>
                    </div>

                    {p.visaMode && (
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mt-4 flex flex-col gap-4">
                        <p className="text-sm font-bold text-slate-700">Thông tin passport</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Passport Number</label>
                            <input
                              type="text"
                              value={p.passportNumber}
                              onChange={(e) => updateParticipant(p.id, "passportNumber", e.target.value)}
                              placeholder="C1234567"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Passport Nationality</label>
                            <input
                              type="text"
                              maxLength={3}
                              value={p.passportNationality}
                              onChange={(e) => updateParticipant(p.id, "passportNationality", e.target.value.toUpperCase())}
                              placeholder="VN"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Issued Date</label>
                            <input
                              type="date"
                              value={p.passportIssuedAt}
                              onChange={(e) => updateParticipant(p.id, "passportIssuedAt", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">
                              Expires Date {tourReturnDate && <span className="font-normal text-slate-400">(sau {tourReturnDate})</span>}
                            </label>
                            <input
                              type="date"
                              value={p.passportExpiresAt}
                              onChange={(e) => updateParticipant(p.id, "passportExpiresAt", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Passport File URL</label>
                            <input
                              type="url"
                              value={p.passportFileUrl}
                              onChange={(e) => updateParticipant(p.id, "passportFileUrl", e.target.value)}
                              placeholder="https://..."
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                            />
                          </div>
                        </div>

                        {p.visaMode === "has_visa" && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-sm font-bold text-slate-700 mb-4">Hồ sơ visa</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Destination Country (ISO)</label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={p.destinationCountry}
                                  onChange={(e) => updateParticipant(p.id, "destinationCountry", e.target.value.toUpperCase())}
                                  placeholder="JP, US, KR..."
                                  disabled={!p.isNew && p.hasVisaApp}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all "
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Min Return Date</label>
                                <input
                                  type="date"
                                  value={p.minReturnDate}
                                  onChange={(e) => updateParticipant(p.id, "minReturnDate", e.target.value)}
                                  disabled={!p.isNew && p.hasVisaApp}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all "
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Visa File URL (tùy chọn)</label>
                                <input
                                  type="url"
                                  value={p.visaFileUrl}
                                  onChange={(e) => updateParticipant(p.id, "visaFileUrl", e.target.value)}
                                  placeholder="https://..."
                                  disabled={!p.isNew && p.hasVisaApp}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all "
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {p.visaMode === "needs_support" && (
                          <div className="mt-2 bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm text-amber-900">
                            <p className="font-bold mb-1">Yêu cầu hỗ trợ làm visa</p>
                            <p>
                              Hệ thống sẽ dùng thông tin passport trên để tạo yêu cầu hỗ trợ. Operator sẽ báo phí dịch vụ sau.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!p.isNew && !isVisaActionable(p) && (
                  <div className="mt-8 pt-8 border-t border-slate-100 border-dashed">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 font-medium text-sm w-fit">
                      <CheckCircle weight="fill" className="size-5" />
                      Saved
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {(maxParticipants === 0 || participants.length < maxParticipants) && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={addParticipant}
              className="w-full py-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center gap-3"
            >
              <UserCirclePlus weight="fill" className="size-6" />
              Add Another Guest
            </motion.button>
          )}
        </div>

        <div className="mt-12 flex justify-end gap-4">
          <Link href={`/bookings/${bookingId}`} className="px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 hover:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving && <Spinner className="animate-spin" />}
            {isSaving ? "Saving..." : "Save Participants"}
          </button>
        </div>
      </div>
    </div>
  );
}
