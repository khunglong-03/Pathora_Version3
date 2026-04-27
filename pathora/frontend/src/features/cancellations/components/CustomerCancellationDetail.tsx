"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Ticket, WarningCircle, Info } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { CancellationDetail } from "./CancellationData";
import { CancellationRefundCard } from "./CancellationRefundCard";
import { CancellationTimeline } from "./CancellationTimeline";

export function CustomerCancellationDetail({ data }: { data: CancellationDetail }) {
  const isPending = data.status === "pending";

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Hero Header */}
      <div className="pt-24 pb-12 bg-white border-b border-slate-200/50">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8">
          <Link
            href={`/bookings/${data.bookingId}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
          >
            <ArrowLeft weight="bold" className="size-4" />
            Back to Booking
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest mb-4">
                <Ticket weight="bold" className="size-4" />
                {data.bookingId}
              </div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 leading-none"
              >
                Cancellation Request
              </motion.h1>
            </div>
            <div className="shrink-0 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
              <p className={`text-xl font-bold capitalize ${
                data.status === 'approved' ? 'text-emerald-500' :
                data.status === 'rejected' ? 'text-rose-500' :
                data.status === 'refunded' ? 'text-blue-500' :
                'text-orange-500'
              }`}>
                {data.status}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Reason Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-8"
            >
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-4">Reason for Cancellation</h3>
              <p className="text-base text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                &quot;{data.reason}&quot;
              </p>
              
              {isPending && (
                <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-orange-50 text-orange-800 border border-orange-100">
                  <WarningCircle weight="bold" className="size-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">
                    Your request is currently under review by our team. You will be notified once a decision has been made.
                  </p>
                </div>
              )}
            </motion.div>

            <CancellationTimeline events={data.timeline} />
          </div>

          <div className="lg:col-span-1 flex flex-col gap-8">
            <CancellationRefundCard breakdown={data.refundBreakdown} status={data.status} />
            
            <div className="bg-slate-900 rounded-[2.5rem] p-6 lg:p-8 text-white">
              <div className="size-10 bg-slate-800 rounded-xl flex items-center justify-center mb-6">
                <Info weight="bold" className="size-5 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold tracking-tight mb-2">Need Help?</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                If you have any questions regarding your cancellation or the refund policy, please contact our support team.
              </p>
              <button className="w-full py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:scale-[0.98] transition-transform">
                Contact Support
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
