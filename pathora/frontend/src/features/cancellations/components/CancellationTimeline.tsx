import React from "react";
import { CancellationTimelineEvent } from "./CancellationData";
import { CheckCircle, Clock, XCircle, Bank } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export function CancellationTimeline({ events }: { events: CancellationTimelineEvent[] }) {
  const getIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle weight="fill" className="size-6 text-emerald-500" />;
      case "rejected": return <XCircle weight="fill" className="size-6 text-rose-500" />;
      case "refunded": return <Bank weight="fill" className="size-6 text-blue-500" />;
      default: return <Clock weight="fill" className="size-6 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 lg:p-8">
      <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-8">Timeline</h3>
      
      <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
        {events.map((event, index) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={index} 
            className="relative pl-8"
          >
            <div className="absolute -left-[15px] top-0 size-[28px] rounded-full bg-white border-4 border-white flex items-center justify-center">
              {getIcon(event.status)}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
              <p className="text-base font-bold text-slate-900 capitalize">
                {event.status === "pending" ? "Request Submitted" : event.status}
              </p>
              <p className="text-xs font-bold font-mono text-slate-400">
                {new Date(event.date).toLocaleString()}
              </p>
            </div>
            {event.note && (
              <p className="text-sm text-slate-500 leading-relaxed mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {event.note}
              </p>
            )}
            <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              By {event.actor}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
