"use client";
import React, { useState } from "react";
import { Info, MapTrifold, Clock, Tag, MapPin, Users, CheckCircle, Calendar, CaretDown, CaretUp } from "@phosphor-icons/react";
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
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary">("overview");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 20 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col p-4"
    >
      {/* Tab header */}
      <div className="flex bg-slate-50 rounded-[2rem] p-2 border border-slate-100">
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
            Overview
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
            Itinerary
          </span>
        </button>
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
          ) : (
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
                    <ItineraryDayCard key={day.id || index} day={day} index={index} />
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
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ItineraryDayCard({ day, index }: { day: any; index: number }) {
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
