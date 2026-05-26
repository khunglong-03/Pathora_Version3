"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, MapTrifold, Clock, Tag, MapPin, Users, CheckCircle, Calendar, CaretDown, CaretUp, Bed, CarProfile, AirplaneTilt, Train, Boat, ArrowRight, IdentificationCard, X, DownloadSimple } from "@phosphor-icons/react";
import { BookingDetail } from "./BookingDetailData";
import { QuickInfoItem } from "./BookingDetailSubComponents";
import { motion, AnimatePresence } from "framer-motion";
import { NormalizedTourInstanceDto } from "@/types/tour";

interface BookingOverviewTabProps {
  booking: BookingDetail;
  tourInstance?: NormalizedTourInstanceDto | null;
  totalGuests: number;
  getTierLabel: (tier: BookingDetail["tier"]) => string;
}

export function BookingOverviewTab({ booking, tourInstance, totalGuests, getTierLabel }: BookingOverviewTabProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary" | "tickets">("overview");
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const isBookingPaid = booking.paymentStatus === "paid" || booking.paymentStatus === "partial";

  // Lock body scroll when lightbox is open
  React.useEffect(() => {
    if (activeImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeImage]);

  // Close lightbox on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImage(null);
      }
    };
    if (activeImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage]);

  // Force download of ticket images (works cross-origin)
  const handleDownloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const filename = url.substring(url.lastIndexOf("/") + 1) || "ticket_scan.jpg";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback if fetch fails (e.g. CORS block)
      window.open(url, "_blank");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col p-4"
    >
      {/* Tab header */}
      <div className="flex bg-slate-50 rounded-[2rem] p-2 border border-slate-100 flex-wrap sm:flex-nowrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`relative flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-sm font-bold transition-colors overflow-hidden ${
            activeTab === "overview"
              ? "text-slate-900"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
          }`}
        >
          {activeTab === "overview" && (
            <motion.div
              layoutId="activeTabBg"
              className="absolute inset-0 bg-white shadow-sm border border-slate-100"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Info weight={activeTab === "overview" ? "fill" : "regular"} className="size-5" />
            {t("booking.details.tabs.overview", "Overview")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("itinerary")}
          className={`relative flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-sm font-bold transition-colors overflow-hidden ${
            activeTab === "itinerary"
              ? "text-slate-900"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
          }`}
        >
          {activeTab === "itinerary" && (
            <motion.div
              layoutId="activeTabBg"
              className="absolute inset-0 bg-white shadow-sm border border-slate-100"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <MapTrifold weight={activeTab === "itinerary" ? "fill" : "regular"} className="size-5" />
            {t("booking.details.tabs.itinerary", "Itinerary")}
          </span>
        </button>
        {isBookingPaid && (
          <button
            type="button"
            onClick={() => setActiveTab("tickets")}
            className={`relative flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-sm font-bold transition-colors overflow-hidden ${
              activeTab === "tickets"
                ? "text-slate-900"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
            }`}
          >
            {activeTab === "tickets" && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 bg-white shadow-sm border border-slate-100"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <IdentificationCard weight={activeTab === "tickets" ? "fill" : "regular"} className="size-5" />
              {t("booking.details.tabs.ticketsAndStatus", "Vé & Trạng thái")}
            </span>
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === "overview" ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8"
            >
              {/* Quick info strip (Infinite Data Carousel style) */}
              <div className="overflow-hidden relative rounded-[1.5rem] border border-slate-100 bg-slate-50 py-6 px-2">
                <div className="flex gap-4 min-w-max px-4">
                  <div className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-4 rounded-xl shadow-sm">
                    <Clock weight="fill" className="size-5 text-amber-500" />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Duration</p>
                      <p className="text-sm font-bold text-slate-900">{booking.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-4 rounded-xl shadow-sm">
                    <Tag weight="fill" className="size-5 text-blue-500" />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Package</p>
                      <p className="text-sm font-bold text-slate-900">{getTierLabel(booking.tier)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-4 rounded-xl shadow-sm">
                    <MapPin weight="fill" className="size-5 text-emerald-500" />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Location</p>
                      <p className="text-sm font-bold text-slate-900">{booking.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-4 rounded-xl shadow-sm">
                    <Users weight="fill" className="size-5 text-indigo-500" />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Guests</p>
                      <p className="text-sm font-bold text-slate-900">{totalGuests} pax</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* About This Tour */}
              <div className="px-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-4">
                  About This Tour
                </h3>
                <p className="text-base font-medium text-slate-500 leading-relaxed max-w-3xl">
                  {booking.description}
                </p>
              </div>

              {/* Tour Highlights */}
              <div className="px-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-6">
                  Tour Highlights
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {booking.highlights.map((highlight, index) => (
                    <motion.div 
                      key={highlight} 
                      whileHover={{ scale: 1.02 }}
                      className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center justify-center size-8 rounded-full bg-emerald-50 shrink-0 border border-emerald-100">
                        <CheckCircle weight="fill" className="size-4 text-emerald-500" />
                      </div>
                      <span className="text-base font-bold text-slate-700 leading-tight pt-1.5">{highlight}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : activeTab === "itinerary" ? (
            <motion.div 
              key="itinerary"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {tourInstance?.days && tourInstance.days.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {tourInstance.days.map((day, index) => (
                    <ItineraryDayCard key={day.id || index} day={day} index={index} isBookingPaid={isBookingPaid} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                  <div className="size-24 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 relative overflow-hidden">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,#e2e8f0_0%,#f8fafc_50%,#e2e8f0_100%)] opacity-50"
                    />
                    <MapTrifold weight="fill" className="size-10 text-slate-400 relative z-10" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Itinerary coming soon</p>
                  <p className="text-base font-medium text-slate-400 max-w-sm">Detailed day-by-day plans will be available closer to your departure date.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {tourInstance === null ? (
                <div className="flex flex-col gap-6 animate-pulse">
                  <div className="h-16 bg-slate-100 rounded-3xl w-full" />
                  <div className="relative pl-4 sm:pl-8 before:absolute before:left-[15px] sm:before:left-[31px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {[1, 2].map((i) => (
                      <div key={i} className="relative flex flex-col gap-4 mb-8">
                        <div className="absolute -left-[25px] sm:-left-[41px] top-1.5 size-4 rounded-full border-2 border-white ring-4 ring-slate-100 bg-slate-200" />
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <div className="h-5 bg-slate-100 rounded-lg w-1/3" />
                          <div className="h-5 bg-slate-100 rounded-full w-16" />
                        </div>
                        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 h-32" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (!booking.tickets || booking.tickets.length === 0) && (!booking.roomAssignments || booking.roomAssignments.length === 0) ? (
                <div className="text-center py-20 flex flex-col items-center justify-center bg-slate-50/30 rounded-3xl border border-dashed border-slate-250">
                  <div className="size-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                    <IdentificationCard weight="fill" className="size-8 text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-800 mb-2">{t("booking.tickets.noTicket", "Vé chưa được cập nhật")}</p>
                  <p className="text-sm text-slate-400 max-w-sm">Thông tin vé di chuyển và phòng ở sẽ hiển thị tại đây sau khi được cập nhật.</p>
                </div>
              ) : tourInstance?.days && tourInstance.days.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {/* Progress summary header */}
                  {(() => {
                    const totalDays = tourInstance?.days?.length || 0;
                    const completedDays = booking.dayStatuses?.filter(s => s.activityStatus === "Completed").length || 0;
                    const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
                    
                    return (
                      <div className="mb-6 p-6 bg-slate-50 border border-slate-150 rounded-[1.8rem] flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col gap-1">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            {t("booking.tickets.title", "Vé & Trạng thái")}
                          </h4>
                          <p className="text-xs font-bold text-slate-500">
                            {completedDays === totalDays 
                              ? t("booking.tickets.allConfirmed", "Tất cả các ngày đã hoàn thành")
                              : t("booking.tickets.summary", "{{confirmed}}/{{total}} ngày đã hoàn thành", { confirmed: completedDays, total: totalDays })}
                          </p>
                        </div>
                        <div className="flex-1 max-w-md w-full flex items-center gap-4">
                          <div className="flex-1 h-2.5 bg-slate-200/50 rounded-full overflow-hidden relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                          <span className="text-xs font-black text-emerald-600 shrink-0">{progressPercent}%</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col gap-6 relative pl-4 sm:pl-8 before:absolute before:left-[15px] sm:before:left-[31px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {tourInstance.days.map((day, index) => {
                      const statusDto = booking.dayStatuses?.find(s => s.tourDayId === day.id);
                      const status = statusDto?.activityStatus || "NotStarted";

                      let statusColor = "bg-slate-100 text-slate-400 border-slate-200";
                      let dotColor = "bg-slate-300 ring-slate-100";
                      let statusText = t("booking.details.timeline.status.notStarted", "Chưa bắt đầu");

                      if (status === "InProgress") {
                        statusColor = "bg-blue-50 text-blue-600 border-blue-100";
                        dotColor = "bg-blue-500 ring-blue-100 animate-pulse";
                        statusText = t("booking.details.timeline.status.inProgress", "Đang diễn ra");
                      } else if (status === "Completed") {
                        statusColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                        dotColor = "bg-emerald-500 ring-emerald-100";
                        statusText = t("booking.details.timeline.status.completed", "Đã hoàn thành");
                      } else if (status === "Cancelled") {
                        statusColor = "bg-red-50 text-red-600 border-red-100";
                        dotColor = "bg-red-500 ring-red-100";
                        statusText = t("booking.details.timeline.status.cancelled", "Đã hủy");
                      }

                      const dayActivities = day.activities || [];
                      const activityIds = dayActivities.map((a: any) => a.id);

                      const dayTickets = booking.tickets?.filter(t => activityIds.includes(t.tourInstanceDayActivityId)) || [];
                      const dayRooms = booking.roomAssignments?.filter(r => activityIds.includes(r.tourInstanceDayActivityId)) || [];

                      const hasTickets = dayTickets.length > 0;
                      const hasRooms = dayRooms.length > 0;

                      return (
                        <div key={day.id || index} className="relative flex flex-col gap-4 group">
                          <div className={`absolute -left-[25px] sm:-left-[41px] top-1.5 size-4 rounded-full border-2 border-white ring-4 ${dotColor} z-20 transition-all`} />

                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-base font-black text-slate-800">
                                {t("booking.details.timeline.day", "Ngày {{day}}", { day: index + 1 })}
                              </span>
                              <span className="text-slate-400 font-medium">|</span>
                              <span className="text-sm font-bold text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                                {day.title || `Lịch trình ngày ${index + 1}`}
                              </span>
                            </div>
                            
                            <span className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {hasTickets && (
                              <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                                <h5 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
                                  <AirplaneTilt weight="fill" className="size-5 text-blue-500" />
                                  {t("booking.details.tickets.title", "Thông Tin Vé Di Chuyển")}
                                </h5>
                                <div className="flex flex-col gap-4">
                                  {dayTickets.map((ticket) => {
                                    const matchingActivity = dayActivities.find((a: any) => a.id === ticket.tourInstanceDayActivityId);
                                    const activityTicketImages = booking.ticketImages?.filter(img => img.tourInstanceDayActivityId === ticket.tourInstanceDayActivityId) || [];
                                    
                                    let TransportIcon = AirplaneTilt;
                                    if (matchingActivity?.transportationType === "Train") TransportIcon = Train;
                                    else if (matchingActivity?.transportationType === "Boat") TransportIcon = Boat;
                                    else if (matchingActivity?.transportationType === "Car") TransportIcon = CarProfile;

                                    let ticketStatus: "pending" | "confirmed" | "cancelled" = "pending";
                                    if (status === "Cancelled") {
                                      ticketStatus = "cancelled";
                                    } else if (activityTicketImages.length > 0 || status === "Completed" || status === "InProgress") {
                                      ticketStatus = "confirmed";
                                    }

                                    const getTicketStatusBadge = (tStatus: "pending" | "confirmed" | "cancelled") => {
                                      switch (tStatus) {
                                        case "confirmed":
                                          return (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase">
                                              {t("booking.status.confirmed", "Đã xác nhận")}
                                            </span>
                                          );
                                        case "cancelled":
                                          return (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-100 uppercase">
                                              {t("booking.status.cancelled", "Đã hủy")}
                                            </span>
                                          );
                                        case "pending":
                                        default:
                                          return (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-600 border-amber-100 uppercase">
                                              {t("booking.status.pending", "Đang xử lý")}
                                            </span>
                                          );
                                      }
                                    };

                                    return (
                                      <div key={ticket.id} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                          <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                              <TransportIcon weight="bold" className="size-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">
                                              {matchingActivity?.transportationName || matchingActivity?.title || "Phương tiện di chuyển"}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {ticket.seatClass && (
                                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase">
                                                {t("booking.details.tickets.seatClass", "Hạng")}: {ticket.seatClass}
                                              </span>
                                            )}
                                            {getTicketStatusBadge(ticketStatus)}
                                          </div>
                                        </div>

                                        {(matchingActivity?.fromLocation?.locationName || matchingActivity?.toLocation?.locationName) && (
                                          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-3">
                                            <span>{matchingActivity?.fromLocation?.locationName || "N/A"}</span>
                                            <ArrowRight className="size-3 text-slate-400" />
                                            <span>{matchingActivity?.toLocation?.locationName || "N/A"}</span>
                                          </div>
                                        )}

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                                          {ticket.flightNumber && (
                                            <div>
                                              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t("booking.details.tickets.flightNumber", "Số hiệu")}</p>
                                              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{ticket.flightNumber}</p>
                                            </div>
                                          )}
                                          {ticket.seatNumbers && (
                                            <div>
                                              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t("booking.details.tickets.seat", "Số ghế")}</p>
                                              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{ticket.seatNumbers}</p>
                                            </div>
                                          )}
                                          {ticket.eTicketNumbers && (
                                            <div>
                                              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t("booking.details.tickets.eTicket", "Mã đặt chỗ PNR")}</p>
                                              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{ticket.eTicketNumbers}</p>
                                            </div>
                                          )}
                                          {(ticket.departureAt || ticket.arrivalAt) && (
                                            <div className="col-span-2 sm:col-span-1">
                                              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t("booking.details.tickets.departure", "Giờ khởi hành")}</p>
                                              <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                                                {ticket.departureAt ? new Date(ticket.departureAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {ticket.note && (
                                          <div className="mt-3 text-xs text-slate-500 bg-white border border-slate-100 p-2.5 rounded-lg">
                                            <span className="font-bold text-slate-700">Lưu ý:</span> {ticket.note}
                                          </div>
                                        )}

                                        {/* Ticket image attachments scoped per ticket */}
                                        {activityTicketImages.length > 0 ? (
                                          <div className="mt-4 pt-4 border-t border-slate-100">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2 flex items-center gap-1.5">
                                              <IdentificationCard weight="fill" className="size-3.5 text-indigo-500" />
                                              {t("booking.details.tickets.viewTicketImage", "Ảnh vé / QR")}
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                              {activityTicketImages.map((img) => (
                                                <div key={img.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-2 md:p-2.5 shadow-sm">
                                                  <div 
                                                    onClick={() => setActiveImage(img.publicUrl)}
                                                    className="size-12 rounded-lg overflow-hidden border border-slate-100 cursor-pointer bg-slate-50 relative group shrink-0"
                                                  >
                                                    <img src={img.publicUrl} alt={img.note || "Vé quét"} className="size-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                      <span className="text-[8px] font-bold text-white bg-slate-900/60 px-1 py-0.5 rounded">Mở</span>
                                                    </div>
                                                  </div>
                                                  <div className="flex flex-col min-w-0">
                                                    {img.bookingReference && (
                                                      <span className="text-[10px] font-black text-slate-700 truncate">PNR: {img.bookingReference}</span>
                                                    )}
                                                    <button 
                                                      type="button"
                                                      onClick={() => setActiveImage(img.publicUrl)}
                                                      className="text-[11px] font-black text-blue-600 hover:text-blue-700 hover:underline text-left mt-0.5 cursor-pointer"
                                                    >
                                                      {t("booking.details.tickets.viewTicket", "Xem vé")}
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="mt-4 pt-4 border-t border-slate-150 flex items-center gap-2 text-[10px] text-slate-400 italic">
                                            <IdentificationCard className="size-3.5" />
                                            <span>{t("booking.details.tickets.noTicket", "Vé chưa được cập nhật")}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {hasRooms && (
                              <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                                <h5 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
                                  <Bed weight="fill" className="size-5 text-emerald-500" />
                                  {t("booking.details.rooms.title", "Thông Tin Phòng Ở")}
                                </h5>
                                <div className="flex flex-col gap-4">
                                  {dayRooms.map((room) => {
                                    const matchingActivity = dayActivities.find((a: any) => a.id === room.tourInstanceDayActivityId);

                                    return (
                                      <div key={room.id} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                            <Bed weight="bold" className="size-4" />
                                          </div>
                                          <div>
                                            <span className="text-sm font-bold text-slate-800 block">
                                              {matchingActivity?.accommodation?.supplierName || "Khách sạn"}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                                          <div>
                                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t("booking.details.rooms.roomType", "Loại phòng")}</p>
                                            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{room.roomType || "Standard"}</p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t("booking.details.rooms.roomCount", "Số lượng phòng")}</p>
                                            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{room.roomCount} phòng</p>
                                          </div>
                                          {room.roomNumbers && (
                                            <div>
                                              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t("booking.details.rooms.roomNumbers", "Số phòng")}</p>
                                              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{room.roomNumbers}</p>
                                            </div>
                                          )}
                                        </div>

                                        {room.note && (
                                          <div className="mt-3 text-xs text-slate-500 bg-white border border-slate-100 p-2.5 rounded-lg">
                                            <span className="font-bold text-slate-700">Lưu ý:</span> {room.note}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {!hasTickets && !hasRooms && (
                              <div className="bg-slate-50/50 border border-slate-100/50 rounded-2xl p-4 flex items-center justify-center text-slate-400 text-xs font-semibold italic">
                                {t("booking.details.timeline.noDetails", "Chưa có thông tin chi tiết vé di chuyển hoặc phòng ở cho ngày này.")}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                  <div className="size-24 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 relative overflow-hidden">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,#e2e8f0_0%,#f8fafc_50%,#e2e8f0_100%)] opacity-50"
                    />
                    <MapTrifold weight="fill" className="size-10 text-slate-400 relative z-10" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Thông tin đang được cập nhật</p>
                  <p className="text-base font-medium text-slate-400 max-w-sm">Vé di chuyển và phòng khách sạn sẽ được cập nhật khi có lịch trình chính thức.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 md:p-8 backdrop-blur-md"
          >
            <div className="absolute inset-0 cursor-zoom-out" onClick={() => setActiveImage(null)} />
            
            <div className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center gap-4 z-10">
              <button
                type="button"
                onClick={() => setActiveImage(null)}
                className="absolute -top-12 right-0 flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="size-5" />
              </button>
              
              <div className="relative w-full h-[70vh] flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                <img 
                  src={activeImage} 
                  alt="Vé quét phóng to" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleDownloadImage(activeImage)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg cursor-pointer"
                >
                  <DownloadSimple className="size-5" />
                  <span>{t("booking.details.tickets.download", "Tải xuống")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors border border-slate-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ItineraryDayCard({ day, index, isBookingPaid }: { day: any; index: number; isBookingPaid?: boolean }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button 
        type="button"
        className="w-full flex items-center gap-4 p-5 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col items-center justify-center size-12 rounded-2xl bg-white border border-slate-100 shadow-sm shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Day</span>
          <span className="text-lg font-black text-blue-600 leading-none">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-slate-900 truncate">{day.title || `Ngày ${index + 1}`}</h4>
          {day.actualDate && (
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar weight="fill" className="size-4" />
              {new Date(day.actualDate).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
        <div className="size-10 rounded-full flex items-center justify-center bg-white border border-slate-100 text-slate-400 shrink-0 shadow-sm">
          {expanded ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 border-t border-slate-100">
              {day.description && (
                <p className="text-slate-600 text-base leading-relaxed mb-6">{day.description}</p>
              )}
              
              <div className="flex flex-col gap-4">
                {day.activities && day.activities.length > 0 ? (
                  day.activities.map((activity: any, actIndex: number) => (
                    <div key={activity.id || actIndex} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="size-3 rounded-full bg-blue-100 border-2 border-blue-500 shrink-0 z-10 mt-1.5" />
                        {actIndex !== day.activities.length - 1 && (
                          <div className="w-0.5 h-full bg-slate-100 my-1 group-hover:bg-blue-100 transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h5 className="font-bold text-slate-900">{activity.title}</h5>
                          {activity.startTime && (
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {activity.startTime.slice(0, 5)} {activity.endTime ? `- ${activity.endTime.slice(0, 5)}` : ""}
                            </span>
                          )}
                          {activity.isOptional && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Tuỳ chọn
                            </span>
                          )}
                        </div>
                        {activity.description && (
                          <p className="text-sm text-slate-500 mt-1">{activity.description}</p>
                        )}
                        {activity.note && (
                          <div className="mt-3 text-sm text-amber-700 bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex gap-2 items-start">
                            <Info weight="fill" className="size-4 shrink-0 mt-0.5" />
                            <p>{activity.note}</p>
                          </div>
                        )}
                        
                        {/* Service Assignment Display (Only shown if booking is paid) */}
                        {isBookingPaid && (() => {
                          const isTransport = activity.activityType === "Transportation" || activity.activityType === "7"; // Enum 7
                          const isAccommodation = activity.activityType === "Accommodation" || activity.activityType === "8"; // Enum 8
                          
                          const hasTransportAssigned = isTransport && (
                            (activity.transportAssignments && activity.transportAssignments.length > 0) || 
                            activity.vehicleType || 
                            activity.driverName || 
                            activity.externalTransportConfirmed
                          );
                          
                          const hasAccommodationAssigned = isAccommodation && activity.accommodation?.supplierName;

                          return (
                            <>
                              {hasTransportAssigned && (
                                <div className="mt-3 bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex flex-col gap-2 shadow-sm">
                                  <div className="flex items-center gap-2 text-blue-700 font-bold mb-1 border-b border-blue-100 pb-2">
                                    {activity.transportationType === "Flight" ? (
                                      <AirplaneTilt weight="fill" className="size-5" />
                                    ) : activity.transportationType === "Train" ? (
                                      <Train weight="fill" className="size-5" />
                                    ) : activity.transportationType === "Boat" ? (
                                      <Boat weight="fill" className="size-5" />
                                    ) : (
                                      <CarProfile weight="fill" className="size-5" />
                                    )}
                                    <span>Thông tin di chuyển</span>
                                    {activity.externalTransportConfirmed && (
                                      <span className="ml-auto text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Đã xác nhận</span>
                                    )}
                                  </div>
                                  
                                  {activity.transportationName && (
                                    <div className="text-sm font-semibold text-slate-800">
                                      {activity.transportationName}
                                    </div>
                                  )}

                                  {(activity.fromLocationName || activity.toLocationName) && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                      <span>{activity.fromLocationName || "N/A"}</span>
                                      <ArrowRight className="size-3 text-slate-400" />
                                      <span>{activity.toLocationName || "N/A"}</span>
                                    </div>
                                  )}

                                  {activity.externalTransportReference && (
                                    <div className="text-sm flex items-center gap-1.5 text-slate-600 mt-1">
                                      <IdentificationCard weight="fill" className="size-4 text-slate-400" />
                                      <span className="text-slate-500">Mã đặt chỗ:</span> 
                                      <span className="font-bold text-slate-800">{activity.externalTransportReference}</span>
                                    </div>
                                  )}

                                  {/* In-app vehicle assignments */}
                                  {activity.transportAssignments && activity.transportAssignments.length > 0 ? (
                                    <div className="flex flex-col gap-2 mt-1">
                                      {activity.transportAssignments.map((ta: any, idx: number) => (
                                        <div key={ta.id || idx} className="text-sm bg-white border border-blue-100 p-2.5 rounded-lg">
                                          <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-800">{ta.vehicleBrand || "Phương tiện"} {ta.vehicleModel}</span>
                                            {ta.vehicleType && <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{ta.vehicleType}</span>}
                                          </div>
                                          {ta.driverName && (
                                            <div className="text-slate-600 flex items-center gap-1 mt-1 pt-1 border-t border-slate-100">
                                              Tài xế: <span className="font-medium text-slate-800">{ta.driverName}</span>
                                              {ta.driverPhone && <span>- {ta.driverPhone}</span>}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    (activity.vehicleType || activity.driverName || activity.vehicleBrand) && (
                                      <div className="text-sm bg-white border border-blue-100 p-2.5 rounded-lg mt-1">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-bold text-slate-800">{activity.vehicleBrand || "Phương tiện"} {activity.vehicleModel}</span>
                                          {activity.vehicleType && <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{activity.vehicleType}</span>}
                                        </div>
                                        {activity.driverName && (
                                          <div className="text-slate-600 flex items-center gap-1 mt-1 pt-1 border-t border-slate-100">
                                            Tài xế: <span className="font-medium text-slate-800">{activity.driverName}</span>
                                            {activity.driverPhone && <span>- {activity.driverPhone}</span>}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                              
                              {hasAccommodationAssigned && (
                                <div className="mt-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex flex-col gap-2 shadow-sm">
                                  <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1 border-b border-emerald-100 pb-2">
                                    <Bed weight="fill" className="size-5" />
                                    <span>Thông tin chỗ ở</span>
                                  </div>
                                  <div className="text-sm font-bold text-slate-800">
                                    {activity.accommodation?.supplierName}
                                  </div>
                                  {activity.accommodationName && activity.accommodationName !== activity.accommodation?.supplierName && (
                                    <div className="text-sm text-slate-600 font-medium">
                                      {activity.accommodationName}
                                    </div>
                                  )}
                                  <div className="text-sm text-slate-600 flex items-center gap-1.5">
                                    Loại phòng: <span className="font-medium text-slate-800">{activity.accommodation?.roomType || "Tiêu chuẩn"}</span>
                                  </div>
                                  {activity.accommodationAddress && (
                                    <div className="text-sm text-slate-500 flex items-start gap-1.5 mt-1">
                                      <MapPin weight="fill" className="size-4 shrink-0 mt-0.5 text-slate-400" />
                                      <span>{activity.accommodationAddress}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">Không có hoạt động nào được lên lịch.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
