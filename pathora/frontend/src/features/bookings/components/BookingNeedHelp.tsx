"use client";
import React from "react";
import { Icon } from "@/components/ui";

export function BookingNeedHelp() {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background:
          "linear-gradient(147deg, #05073c 0%, rgba(5, 7, 60, 0.8) 100%)",
      }}
    >
      <h3 className="text-lg font-bold text-white mb-1">Need Help?</h3>
      <p className="text-sm text-white/80 mb-5">
        Contact our support team for any questions about your booking.
      </p>

      <div className="flex flex-col gap-2">
        {/* Phone */}
        <a
          href="tel:+1234567890"
          className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-3 hover:bg-white/15 transition-colors"
        >
          <Icon icon="heroicons:phone" className="size-4 text-white/70" />
          <div>
            <p className="text-xs text-white/60">Phone</p>
            <p className="text-sm font-semibold text-white">
              +1 (234) 567-890
            </p>
          </div>
        </a>
        {/* Email */}
        <a
          href="mailto:support@pathora.com"
          className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-3 hover:bg-white/15 transition-colors"
        >
          <Icon icon="heroicons:envelope" className="size-4 text-white/70" />
          <div>
            <p className="text-xs text-white/60">Email</p>
            <p className="text-sm font-semibold text-white">
              support@pathora.com
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
