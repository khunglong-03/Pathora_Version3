"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { CheckCircle, Info } from "@phosphor-icons/react";
import { tourInstanceService } from "@/api/services/tourInstanceService";

interface Props {
  instanceId: string;
  isAccepted: boolean;
  onSuccess?: () => void;
}

export function TourGuideInstanceActionPanel({ instanceId, isAccepted, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await tourInstanceService.guideApprove(instanceId);
      toast.success("Successfully accepted tour assignment");
      onSuccess?.();
    } catch (err) {
      toast.error("Failed to accept assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isAccepted) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-[1.5rem] p-4 flex items-center justify-between mb-8 shadow-sm">
        <div className="flex items-center gap-3 text-emerald-800">
          <CheckCircle weight="fill" className="size-6 text-emerald-600" />
          <div>
            <p className="font-bold text-sm">Assignment Accepted</p>
            <p className="text-xs text-emerald-600/80 font-medium">You have confirmed your assignment for this tour.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-lg">
          Ready to go
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-[1.5rem] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shadow-sm">
      <div className="flex items-start md:items-center gap-3 text-slate-700">
        <div className="mt-0.5 md:mt-0 p-2 bg-blue-50 text-blue-600 rounded-full shrink-0">
          <Info weight="bold" className="size-5" />
        </div>
        <div>
          <p className="font-bold text-slate-900">Pending Assignment Confirmation</p>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Please review the itinerary and confirm that you accept this tour assignment.
          </p>
        </div>
      </div>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="shrink-0 w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-[0_8px_16px_-6px_rgba(5,150,105,0.4)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {loading ? (
          <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <CheckCircle weight="bold" className="size-5" />
        )}
        {loading ? "Accepting..." : "Accept Assignment"}
      </button>
    </div>
  );
}
