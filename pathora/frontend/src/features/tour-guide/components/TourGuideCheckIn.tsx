"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UsersThree, UserCheck, WarningCircle, CheckCircle, MagnifyingGlass, FileText } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { SAMPLE_GUESTS, Guest } from "./TourGuideCheckInData";

export function TourGuideCheckIn({ instanceId }: { instanceId: string }) {
  const [guests, setGuests] = useState<Guest[]>(SAMPLE_GUESTS);
  const [search, setSearch] = useState("");

  const toggleStatus = (id: string, currentStatus: Guest["status"]) => {
    const newStatus = currentStatus === "pending" ? "checked-in" : currentStatus === "checked-in" ? "checked-out" : "pending";
    setGuests(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g));
  };

  const filteredGuests = guests.filter(g => 
    g.fullName.toLowerCase().includes(search.toLowerCase()) || 
    g.bookingRef.toLowerCase().includes(search.toLowerCase())
  );

  const checkedInCount = guests.filter(g => g.status === "checked-in").length;
  const totalCount = guests.length;
  const progressPercent = Math.round((checkedInCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <Link
          href="/tour-guide"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft weight="bold" className="size-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-100">
              <UserCheck weight="bold" className="size-4" />
              Check-In / Out
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              Guest Attendance
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Tour Instance: {instanceId}
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm">
            <div className="relative size-12 flex items-center justify-center">
              <svg className="size-12 -rotate-90">
                <circle cx="24" cy="24" r="20" className="stroke-slate-100 fill-none" strokeWidth="4" />
                <circle 
                  cx="24" 
                  cy="24" 
                  r="20" 
                  className="stroke-emerald-500 fill-none transition-all duration-500 ease-out" 
                  strokeWidth="4" 
                  strokeDasharray={`${2 * Math.PI * 20}`} 
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercent / 100)}`} 
                  strokeLinecap="round" 
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-900">{progressPercent}%</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Checked In</p>
              <p className="text-xl font-bold text-slate-900">{checkedInCount} / {totalCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-8">
          
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 pb-8 border-b border-slate-100 border-dashed">
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or booking ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">
                Export List
              </button>
            </div>
          </div>

          {/* Guest List */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGuests.map((guest) => (
              <motion.div 
                key={guest.id}
                layout
                className={`p-5 rounded-[1.5rem] border transition-all ${
                  guest.status === "checked-in" 
                    ? "bg-emerald-50/30 border-emerald-200" 
                    : guest.status === "checked-out" 
                      ? "bg-slate-50 border-slate-200" 
                      : "bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{guest.fullName}</h4>
                    <p className="text-xs font-bold font-mono text-slate-500 mt-0.5">{guest.bookingRef}</p>
                  </div>
                  <button 
                    onClick={() => toggleStatus(guest.id, guest.status)}
                    className={`flex items-center justify-center size-10 rounded-full transition-colors ${
                      guest.status === "checked-in" 
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                        : guest.status === "checked-out"
                          ? "bg-slate-300 text-white"
                          : "bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-500"
                    }`}
                  >
                    <CheckCircle weight="bold" className="size-6" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                      <FileText weight="fill" className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Passport</p>
                      <p className="font-medium text-slate-900">{guest.passportNumber}</p>
                    </div>
                  </div>
                  
                  {guest.dietaryRequirements !== "None" && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-orange-50 text-orange-500 shrink-0">
                        <WarningCircle weight="fill" className="size-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dietary</p>
                        <p className="font-bold text-orange-600">{guest.dietaryRequirements}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 border-dashed flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase tracking-widest ${
                    guest.status === "checked-in" ? "text-emerald-600" : guest.status === "checked-out" ? "text-slate-400" : "text-amber-500"
                  }`}>
                    {guest.status.replace("-", " ")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
