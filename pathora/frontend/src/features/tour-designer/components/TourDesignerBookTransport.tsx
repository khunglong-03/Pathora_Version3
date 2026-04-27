"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bus, MapPin, Clock, Users, Star, CheckCircle, Ticket } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { SAMPLE_TRANSPORT_OPTIONS } from "./TourDesignerBookTransportData";

export function TourDesignerBookTransport({ instanceId }: { instanceId: string }) {
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);

  const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')} VND`;

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Navigation */}
        <Link
          href={`/tour-designer/tour-instances/${instanceId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft weight="bold" className="size-4" />
          Back to Tour Instance
        </Link>

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-100">
              <Bus weight="bold" className="size-4" />
              Transportation
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              Book / Hold Seats
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Tour Instance: {instanceId}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-colors">
              Hold Selected Seats
            </button>
            <button className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:scale-[0.98] transition-transform shadow-lg shadow-slate-900/20">
              Confirm & Book
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Context summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-8 sticky top-8">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-6">Route Summary</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 shrink-0">
                    <MapPin weight="fill" className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Route</p>
                    <p className="text-base font-bold text-slate-900">Hanoi &rarr; Halong Bay</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 shrink-0">
                    <Clock weight="fill" className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Schedule</p>
                    <p className="text-base font-bold text-slate-900">Departure: 08:00 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 shrink-0">
                    <Users weight="fill" className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Required Seats</p>
                    <p className="text-base font-bold text-slate-900">25 Pax</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Available Transport Options */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Available Providers</h3>
            
            {SAMPLE_TRANSPORT_OPTIONS.map((option) => (
              <motion.div 
                key={option.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedTransport(option.id)}
                className={`relative bg-white rounded-[2rem] border transition-all cursor-pointer overflow-hidden p-6 lg:p-8 ${
                  selectedTransport === option.id 
                    ? "border-blue-500 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500" 
                    : "border-slate-200/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:border-blue-300"
                }`}
              >
                {selectedTransport === option.id && (
                  <div className="absolute top-6 right-6 text-blue-500">
                    <CheckCircle weight="fill" className="size-8" />
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="pr-12">
                    <div className="flex items-center gap-2 mb-2">
                      <Star weight="fill" className="size-4 text-orange-400" />
                      <span className="text-sm font-bold text-slate-600">{option.rating}</span>
                      <span className="text-sm text-slate-400 px-2">•</span>
                      <span className={`text-xs font-bold uppercase tracking-widest ${option.status === 'holding' ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {option.status}
                      </span>
                    </div>
                    <h4 className="text-2xl font-bold tracking-tight text-slate-900">{option.providerName}</h4>
                    <p className="text-sm font-medium text-slate-500 mt-1">{option.vehicleType}</p>
                  </div>
                  
                  <div className="sm:text-right shrink-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Price / Seat</p>
                    <p className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(option.pricePerSeat)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 border-dashed">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Capacity</p>
                    <p className="text-sm font-bold text-slate-900">{option.capacity} Seats</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Available</p>
                    <p className="text-sm font-bold text-emerald-600">{option.availableSeats} Seats</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Schedule</p>
                    <p className="text-sm font-bold text-slate-900">{option.departureTime} - {option.arrivalTime}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
