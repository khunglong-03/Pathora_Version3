"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, UserCircle, MapPin, Ticket, WarningCircle } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { CancellationDetail } from "./CancellationData";
import { CancellationRefundCard } from "./CancellationRefundCard";
import { CancellationTimeline } from "./CancellationTimeline";

export function ManagerCancellationDetail({ data }: { data: CancellationDetail }) {
  const isPending = data.status === "pending";

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        
        {/* Navigation */}
        <Link
          href={`/manager/dashboard/bookings`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft weight="bold" className="size-4" />
          Back to Bookings Dashboard
        </Link>

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-widest mb-4 border border-rose-100">
              <WarningCircle weight="bold" className="size-4" />
              Action Required
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              Review Cancellation
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              ID: {data.id} • Booking: {data.bookingId}
            </p>
          </div>
          
          {/* Action Buttons */}
          {isPending && (
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-colors">
                Reject Request
              </button>
              <button className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:scale-[0.98] transition-transform shadow-lg shadow-slate-900/20">
                Approve & Refund
              </button>
            </div>
          )}
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          
          {/* Left Column: Context */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Customer Context */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-8"
            >
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-6">Request Context</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start gap-4">
                  <UserCircle weight="fill" className="size-10 text-slate-300 shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Customer</p>
                    <p className="text-base font-bold text-slate-900">{data.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin weight="fill" className="size-10 text-slate-300 shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Tour Instance</p>
                    <p className="text-base font-bold text-slate-900">{data.tourName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Customer Reason</p>
                <p className="text-base text-slate-700 font-medium leading-relaxed">
                  &quot;{data.reason}&quot;
                </p>
              </div>
            </motion.div>

            <CancellationTimeline events={data.timeline} />
          </div>

          {/* Right Column: Financials */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <CancellationRefundCard breakdown={data.refundBreakdown} status={data.status} />
            
            {/* System Override / Settings */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/50 p-6 lg:p-8">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-4">Refund Policy</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                <p className="text-sm font-bold text-slate-700 mb-1">Standard Policy</p>
                <p className="text-xs text-slate-500">Cancelling within 7 days incurs a 10% penalty. This booking falls within the 7-day window.</p>
              </div>
              <button className="text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
                Override Penalty Manually
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
