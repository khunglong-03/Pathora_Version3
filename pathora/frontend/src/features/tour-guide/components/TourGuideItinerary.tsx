"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapTrifold, MapPin, Bus, ForkKnife, Buildings, CheckCircle, NavigationArrow } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { SAMPLE_ITINERARY } from "./TourGuideItineraryData";

const getActivityIcon = (type: string) => {
  switch (type) {
    case "transport": return <Bus weight="fill" className="size-5" />;
    case "accommodation": return <Buildings weight="fill" className="size-5" />;
    case "meal": return <ForkKnife weight="fill" className="size-5" />;
    case "activity": return <NavigationArrow weight="fill" className="size-5" />;
    default: return <MapPin weight="fill" className="size-5" />;
  }
};

export function TourGuideItinerary({ instanceId }: { instanceId: string }) {
  const [activeDay, setActiveDay] = useState<number>(1);

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8 pb-20">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8">
        <Link
          href="/tour-guide"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft weight="bold" className="size-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-4 border border-indigo-100">
              <MapTrifold weight="bold" className="size-4" />
              Tour Itinerary
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              Instance Schedule
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Tour Instance: {instanceId}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Day Selector Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-3">
            {SAMPLE_ITINERARY.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setActiveDay(day.dayNumber)}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  activeDay === day.dayNumber
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20"
                    : "bg-white border-slate-200/50 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${activeDay === day.dayNumber ? "text-slate-400" : "text-slate-400"}`}>
                  Day {day.dayNumber}
                </p>
                <p className="text-base font-bold mb-1">{day.title}</p>
                <p className={`text-sm ${activeDay === day.dayNumber ? "text-slate-300" : "text-slate-500"}`}>
                  {day.date}
                </p>
              </button>
            ))}
          </div>

          {/* Timeline Content */}
          <div className="md:col-span-8 lg:col-span-9">
            <AnimatePresence mode="wait">
              {SAMPLE_ITINERARY.filter(d => d.dayNumber === activeDay).map((day) => (
                <motion.div
                  key={day.dayNumber}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-10"
                >
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-8 pb-6 border-b border-slate-100 border-dashed">
                    {day.title}
                  </h3>

                  <div className="relative border-l-2 border-slate-100 ml-6 space-y-10">
                    {day.activities.map((activity) => (
                      <div key={activity.id} className="relative pl-8">
                        <div className="absolute -left-[21px] top-1 flex items-center justify-center size-10 rounded-full bg-white border-4 border-[#f9fafb] text-indigo-500 shadow-sm">
                          {getActivityIcon(activity.type)}
                        </div>
                        
                        <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 transition-colors hover:bg-slate-100/50 cursor-default">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-white border border-slate-200 text-slate-900 text-xs font-bold font-mono rounded-lg shadow-sm">
                              {activity.time}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                              {activity.type}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mb-1">{activity.title}</h4>
                          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
                            <MapPin weight="fill" className="size-4" />
                            {activity.location}
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100/50">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
