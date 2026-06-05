"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { bookingService } from "@/api/services";
import { Users, User, Baby, WarningCircle, UserCirclePlus, Spinner, IdentificationCard, CheckCircle, Info } from "@phosphor-icons/react";
import { BookingDetail } from "./BookingDetailData";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface GuestDetailsCardProps {
  booking: BookingDetail;
  totalGuests: number;
}

export function GuestDetailsCard({ booking, totalGuests }: GuestDetailsCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!booking.id) return;
    let isMounted = true;
    setLoading(true);
    bookingService
      .getParticipants(booking.id)
      .then((data) => {
        if (isMounted) {
          setParticipants(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load participants", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [booking.id]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-10 overflow-hidden relative"
    >
      <div className="flex items-center gap-4 mb-10">
        <div className="relative flex items-center justify-center size-12 rounded-[1rem] bg-emerald-50 border border-emerald-100 shadow-sm text-emerald-600 overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-emerald-100/50 rounded-full blur-md"
          />
          <Users weight="fill" className="size-6 relative z-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("landing.bookingDetail.guestDetails")}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {/* Adults */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 transition-colors hover:bg-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-[1rem] bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
              <User weight="fill" className="size-5 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {t("landing.bookingDetail.adults")}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                {t("landing.bookingDetail.ageLabelAdult")}
              </p>
            </div>
          </div>
          <p className="text-4xl font-bold font-mono text-slate-900 tracking-tighter">{booking.adults}</p>
        </motion.div>

        {/* Children */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 transition-colors hover:bg-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-[1rem] bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
              <Baby weight="fill" className="size-5 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {t("landing.bookingDetail.children")}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                {t("landing.bookingDetail.ageLabelChild")}
              </p>
            </div>
          </div>
          <p className="text-4xl font-bold font-mono text-slate-900 tracking-tighter">{booking.children}</p>
        </motion.div>

        {/* Infants */}
        {(booking.infants ?? 0) > 0 && (
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 transition-colors hover:bg-slate-100"
          >
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-[1rem] bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                <Baby weight="fill" className="size-5 text-pink-400" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">
                  {t("landing.bookingDetail.infants")}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                  {t("landing.bookingDetail.ageLabelInfant")}
                </p>
              </div>
            </div>
            <p className="text-4xl font-bold font-mono text-slate-900 tracking-tighter">{booking.infants}</p>
          </motion.div>
        )}
        
        <div className="flex items-center justify-between p-8 mt-4 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
          {/* Subtle moving mesh background */}
          <motion.div 
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_#10b981_0%,_transparent_60%)] opacity-20 pointer-events-none"
          />
          <div className="flex items-center gap-4 relative z-10">
            <div className="size-12 rounded-[1rem] bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
              <Users weight="fill" className="size-6 text-emerald-400" />
            </div>
            <p className="text-lg font-bold">
              {t("landing.bookingDetail.totalGuests")}
            </p>
          </div>
          <p className="text-5xl font-bold font-mono text-white tracking-tighter relative z-10">
            {totalGuests}
          </p>
        </div>

        {/* Passenger Information Status Section */}
        <div className="border-t border-slate-100 pt-6 mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
              <Spinner className="size-5 animate-spin animate-infinite" />
              <span className="text-sm font-medium">Loading passenger info...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
              Failed to load passenger details.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Alert Warning if missing details */}
              {participants.length < totalGuests && (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                  <WarningCircle weight="fill" className="size-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800 leading-snug">
                      {t("landing.bookingDetail.missingPassengerDetailsWarning", {
                        filled: participants.length,
                        total: totalGuests,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Alert Warning if passenger details rejected */}
              {participants.some(p => p.infoReviewStatus === "Rejected") && (
                <div className="p-5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                  <WarningCircle weight="fill" className="size-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-800 leading-snug">
                      {t("landing.bookingDetail.rejectedPassengerDetailsWarning", "Có thông tin hành khách bị từ chối duyệt. Vui lòng cập nhật lại thông tin.")}
                    </p>
                    <div className="mt-2 space-y-1">
                      {participants.filter(p => p.infoReviewStatus === "Rejected").map((p, idx) => (
                        <div key={p.participantId || p.id || idx} className="text-xs text-red-700 font-medium">
                          • <span className="font-bold">{p.fullName}</span>: {p.infoRejectionReason || t("landing.bookingDetail.noRejectionReason", "Cần cập nhật lại thông tin")}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Passenger list */}
              {participants.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <IdentificationCard className="size-4 text-slate-400" />
                    {t("landing.bookingDetail.passengerList")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {participants.map((p, idx) => {
                      const pId = p.participantId || p.id;
                      const hasWarning = p.infoReviewStatus === "Rejected";
                      return (
                        <div
                          key={pId || idx}
                          onClick={() => router.push(`/bookings/${booking.id}/participants#participant-${pId}`)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-slate-700 text-sm font-semibold gap-3 cursor-pointer transition-all hover:bg-slate-100/70 hover:shadow-sm ${
                            hasWarning 
                              ? "bg-red-50/40 border-red-200 hover:bg-red-50/60" 
                              : "bg-slate-50 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{p.fullName || `Passenger ${idx + 1}`}</span>
                          </div>
                          
                          <div className="shrink-0 flex items-center gap-1.5">
                            {p.infoReviewStatus === "Approved" && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                                <CheckCircle weight="fill" className="size-3 text-emerald-600" />
                                {t("landing.bookingDetail.reviewStatusApproved", "Đã duyệt")}
                              </span>
                            )}
                            {p.infoReviewStatus === "Rejected" && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-100">
                                <WarningCircle weight="fill" className="size-3 text-red-600" />
                                {t("landing.bookingDetail.reviewStatusRejected", "Cần sửa")}
                              </span>
                            )}
                            {p.infoReviewStatus === "NotReviewed" && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full border border-slate-200">
                                <Info weight="fill" className="size-3 text-slate-400" />
                                {t("landing.bookingDetail.reviewStatusNotReviewed", "Chờ duyệt")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-2">
                {participants.length < totalGuests ? (
                  <Button
                    type="button"
                    onClick={() => router.push(`/bookings/${booking.id}/participants`)}
                    className="w-full h-11 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <UserCirclePlus className="size-5" />
                    {t("landing.bookingDetail.enterPassengerDetailsBtn")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/bookings/${booking.id}/participants`)}
                    className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <UserCirclePlus className="size-5" />
                    {t("landing.bookingDetail.editPassengerDetailsBtn")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
