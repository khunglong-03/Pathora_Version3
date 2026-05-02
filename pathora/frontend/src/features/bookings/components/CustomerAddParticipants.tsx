"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, UserCirclePlus, UploadSimple, WarningCircle, CheckCircle, Trash, Spinner } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { bookingService } from "@/api/services/bookingService";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface Participant {
  id: string;
  fullName: string;
  dob: string;
  gender: number;
  nationality: string;
  participantType: string;
  documentUploaded: boolean;
  isNew?: boolean;
}

export function CustomerAddParticipants({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [maxParticipants, setMaxParticipants] = useState<number>(0);
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

      if (bookingData) {
        setMaxParticipants((bookingData.numberAdult || 0) + (bookingData.numberChild || 0) + (bookingData.numberInfant || 0));
      }

      if (participantsData && participantsData.length > 0) {
        setParticipants(participantsData.map((p: any) => ({
          id: p.id,
          fullName: p.fullName,
          dob: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
          gender: typeof p.gender === "number" ? p.gender : 0,
          nationality: p.nationality || "VN",
          participantType: p.participantType || "Adult",
          documentUploaded: !!p.passport,
          isNew: false
        })));
      } else {
        // Start with one empty slot if none exist
        setParticipants([{
          id: Date.now().toString(),
          fullName: "",
          dob: "",
          gender: 0,
          nationality: "VN",
          participantType: "Adult",
          documentUploaded: false,
          isNew: true,
        }]);
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
      id: Date.now().toString(),
      fullName: "",
      dob: "",
      gender: 0,
      nationality: "VN",
      participantType: "Adult",
      documentUploaded: false,
      isNew: true,
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

  const handleSave = async () => {
    const newParticipants = participants.filter(p => p.isNew && p.fullName.trim() !== "");
    if (newParticipants.length === 0) {
      toast.success("No new participants to save.");
      router.push(`/bookings/${bookingId}`);
      return;
    }

    setIsSaving(true);
    try {
      for (const p of newParticipants) {
        await bookingService.createParticipant(bookingId, {
          participantType: p.participantType || "Adult",
          fullName: p.fullName,
          dateOfBirth: p.dob ? new Date(p.dob).toISOString() : null,
          gender: p.gender,
          nationality: p.nationality || "VN",
        });
      }
      toast.success("Participants saved successfully");
      router.push(`/bookings/${bookingId}`);
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
                Please provide information for all guests travelling on booking <span className="font-bold text-slate-900">{bookingId}</span>.
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
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <WarningCircle weight="fill" className="size-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 leading-relaxed">
            <p className="font-bold mb-1">Quy trình 2 bước cho tour cần visa</p>
            <p>
              <span className="font-semibold">Bước 1 (màn này):</span> nhập thông tin cơ bản từng hành khách.{" "}
              <span className="font-semibold">Bước 2:</span> sau khi lưu, quay lại trang chi tiết booking để cung cấp passport và nộp hồ sơ visa cho từng người.
            </p>
          </div>
        </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={p.fullName}
                      disabled={!p.isNew}
                      onChange={(e) => updateParticipant(p.id, "fullName", e.target.value)}
                      placeholder="As shown on passport"
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={p.dob}
                      disabled={!p.isNew}
                      onChange={(e) => updateParticipant(p.id, "dob", e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                    <select
                      value={p.gender}
                      disabled={!p.isNew}
                      onChange={(e) => updateParticipant(p.id, "gender", Number(e.target.value))}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium disabled:opacity-60"
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
                      disabled={!p.isNew}
                      maxLength={3}
                      onChange={(e) => updateParticipant(p.id, "nationality", e.target.value.toUpperCase())}
                      placeholder="VN, US, JP..."
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Participant Type</label>
                    <select
                      value={p.participantType}
                      disabled={!p.isNew}
                      onChange={(e) => updateParticipant(p.id, "participantType", e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium disabled:opacity-60"
                    >
                      <option value="Adult">Adult</option>
                      <option value="Child">Child</option>
                      <option value="Infant">Infant</option>
                    </select>
                  </div>
                </div>

                {!p.isNew && (
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
