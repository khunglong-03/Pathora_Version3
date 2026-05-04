"use client";

import React, { useMemo } from "react";
import type { NormalizedTourInstanceVm } from "@/types/tour";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Calendar, CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format, isSameDay } from "date-fns";

interface Props {
  instances: NormalizedTourInstanceVm[];
}

export function TourGuideSchedule({ instances }: Props) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "soldout":
        return "bg-red-100 text-red-800";
      case "inprogress":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-indigo-100 text-indigo-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Map instances to days they cover
  const instancesByDate = useMemo(() => {
    const map = new Map<string, NormalizedTourInstanceVm[]>();
    
    instances.forEach(instance => {
      const start = new Date(instance.startDate);
      const end = new Date(instance.endDate);
      
      // Add instance to every day it covers
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, "yyyy-MM-dd");
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        map.get(dateStr)!.push(instance);
      }
    });
    
    return map;
  }, [instances]);

  const handleDateChange: CalendarProps["onChange"] = (value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedInstances = instancesByDate.get(selectedDateStr) || [];

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6 p-4 pb-24 md:p-6">
      <div className="w-full lg:w-[400px] shrink-0 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden lg:sticky lg:top-24">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {t("tourGuide.schedule.calendarTitle") || "Lịch làm việc"}
          </h2>
        </div>
        <div className="p-4 center">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            className="w-full border-0 rounded-lg font-sans"
            tileClassName={({ date, view }) => {
              if (view === "month") {
                const dateStr = format(date, "yyyy-MM-dd");
                const hasTour = instancesByDate.has(dateStr);
                const isSelected = isSameDay(date, selectedDate);
                
                if (isSelected) {
                  return "bg-indigo-600 text-white rounded-lg";
                }
                if (hasTour) {
                  return "bg-emerald-50 text-emerald-600 font-bold rounded-lg border border-emerald-100";
                }
              }
              return "rounded-lg text-slate-700 hover:bg-slate-100";
            }}
          />
        </div>
      </div>

      <div className="w-full flex-1 v-stack gap-4">
        <h3 className="text-lg font-bold text-slate-900 px-1">
          {format(selectedDate, "dd/MM/yyyy")}
        </h3>
        
        {selectedInstances.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] p-8 center border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <p className="text-slate-500 font-medium text-center">
              {t("tourGuide.schedule.noToursOnDate") || "Bạn không có lịch trình tour nào trong ngày này."}
            </p>
          </div>
        ) : (
          selectedInstances.map((instance) => (
            <Link
              key={instance.id}
              href={`/tour-guide/instances/${instance.id}`}
              className="block bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden hover:border-slate-300 transition-colors shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] active:scale-[0.98]"
            >
              {instance.thumbnail && (
                <div className="h-32 overflow-hidden bg-slate-100">
                  <img
                    src={instance.thumbnail.publicURL}
                    alt={instance.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 v-stack gap-2">
                <div className="h-stack justify-between items-start gap-2">
                  <h4 className="font-bold text-slate-900 line-clamp-2">
                    {instance.title}
                  </h4>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${getStatusColor(instance.status)}`}>
                    {instance.status}
                  </span>
                </div>
                
                <div className="text-sm text-slate-500 font-medium">
                  {instance.tourName}
                </div>
                
                <div className="h-stack items-center justify-between mt-2 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">
                    {format(new Date(instance.startDate), "dd/MM/yyyy")} - {format(new Date(instance.endDate), "dd/MM/yyyy")}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                    Chi tiết &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
