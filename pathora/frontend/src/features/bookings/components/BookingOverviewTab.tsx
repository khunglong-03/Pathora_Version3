"use client";
import React, { useState } from "react";
import { Info, MapTrifold, Clock, Tag, MapPin, Users, CheckCircle } from "@phosphor-icons/react";
import { BookingDetail } from "./BookingDetailData";
import { QuickInfoItem } from "./BookingDetailSubComponents";
import { motion, AnimatePresence } from "framer-motion";

interface BookingOverviewTabProps {
  booking: BookingDetail;
  totalGuests: number;
  getTierLabel: (tier: BookingDetail["tier"]) => string;
}

export function BookingOverviewTab({ booking, totalGuests, getTierLabel }: BookingOverviewTabProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "itinerary">("overview");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col"
    >
      {/* Tab header */}
      <div className="flex border-b border-slate-100 p-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`relative flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-sm font-bold transition-colors overflow-hidden ${
            activeTab === "overview"
              ? "text-slate-900"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          {activeTab === "overview" && (
            <motion.div
              layoutId="activeTabBg"
              className="absolute inset-0 bg-slate-50 border border-slate-100"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Info weight={activeTab === "overview" ? "bold" : "regular"} className="size-4" />
            Overview
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("itinerary")}
          className={`relative flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-sm font-bold transition-colors overflow-hidden ${
            activeTab === "itinerary"
              ? "text-slate-900"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          {activeTab === "itinerary" && (
            <motion.div
              layoutId="activeTabBg"
              className="absolute inset-0 bg-slate-50 border border-slate-100"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <MapTrifold weight={activeTab === "itinerary" ? "bold" : "regular"} className="size-4" />
            Itinerary
          </span>
        </button>
      </div>

      {/* Tab content */}
      <div className="p-8">
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
              {/* Quick info strip */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100/50">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <QuickInfoItem
                    icon={<Clock weight="bold" className="size-5" />}
                    label="Duration"
                    value={booking.duration}
                  />
                  <QuickInfoItem
                    icon={<Tag weight="bold" className="size-5" />}
                    label="Package"
                    value={getTierLabel(booking.tier)}
                  />
                  <QuickInfoItem
                    icon={<MapPin weight="bold" className="size-5" />}
                    label="Location"
                    value={booking.location}
                  />
                  <QuickInfoItem
                    icon={<Users weight="bold" className="size-5" />}
                    label="Guests"
                    value={`${totalGuests} pax`}
                  />
                </div>
              </div>

              {/* About This Tour */}
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-3">
                  About This Tour
                </h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-3xl">
                  {booking.description}
                </p>
              </div>

              {/* Tour Highlights */}
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-4">
                  Tour Highlights
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {booking.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-center size-6 rounded-full bg-emerald-50 shrink-0">
                        <CheckCircle weight="fill" className="size-4 text-emerald-500" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 leading-tight pt-0.5">{highlight}</span>
                    </div>
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
              className="text-center py-20 flex flex-col items-center justify-center"
            >
              <div className="size-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                <MapTrifold weight="fill" className="size-8 text-slate-300" />
              </div>
              <p className="text-xl font-bold tracking-tight text-slate-900 mb-2">Itinerary coming soon</p>
              <p className="text-sm font-medium text-slate-400 max-w-xs">Detailed day-by-day plans will be available closer to your departure date.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
