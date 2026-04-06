"use client";
import React from "react";
import { Icon } from "@/components/ui";
import { BookingDetail } from "./BookingDetailData";

interface BookingImportantInfoProps {
  booking: BookingDetail;
}

export function BookingImportantInfo({ booking }: BookingImportantInfoProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <Icon
          icon="heroicons:information-circle"
          className="size-5 text-blue-700 mt-0.5 shrink-0"
        />
        <div>
          <h3 className="text-sm font-bold text-blue-900 mb-2">
            Important Information
          </h3>
          <ul className="flex flex-col gap-1">
            {booking.importantInfo.map((info) => (
              <li key={info} className="text-xs text-blue-700 leading-relaxed">
                • {info}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
