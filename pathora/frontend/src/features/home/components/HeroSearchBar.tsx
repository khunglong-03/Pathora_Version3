"use client";
import Button from "@/components/ui/Button";
import React, { useState } from "react";
import { Icon } from "@/components/ui";

/* ── Calendar helpers ──────────────────────────────────────── */

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

/* ── Constants ─────────────────────────────────────────────── */
export const DEFAULT_DESTINATIONS = [
  "Ho Chi Minh City",
  "Ha Noi",
  "Da Nang",
  "Moscow",
  "New York",
  "California",
];
export const DEFAULT_CLASSIFICATIONS = ["Standard", "VIP", "Luxury"];
export const DEFAULT_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const PEOPLE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

/* ── Calendar Dropdown ─────────────────────────────────────── */
export const CalendarDropdown = ({
  value,
  onChange,
  locale,
  weekdayLabels,
  previousMonthLabel,
  nextMonthLabel,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  locale: string;
  weekdayLabels: string[];
  previousMonthLabel: string;
  nextMonthLabel: string;
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    value?.getFullYear() ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    value?.getMonth() ?? today.getMonth(),
  );

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const isSelected = (day: number) =>
    value &&
    value.getDate() === day &&
    value.getMonth() === viewMonth &&
    value.getFullYear() === viewYear;
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long" }).format(
    new Date(viewYear, viewMonth, 1),
  );
  const resolvedWeekdayLabels =
    weekdayLabels.length === 7 ? weekdayLabels : DEFAULT_WEEKDAYS;

  return (
    <div className="p-4 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-xl">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button
          type="button"
          onClick={prevMonth}
          aria-label={previousMonthLabel}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent cursor-pointer">
          <Icon
            icon="heroicons-outline:chevron-left"
            className="w-4 h-4 text-gray-600 dark:text-gray-300"
          />
        </Button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {monthLabel} {viewYear}
        </span>
        <Button
          type="button"
          onClick={nextMonth}
          aria-label={nextMonthLabel}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent cursor-pointer">
          <Icon
            icon="heroicons-outline:chevron-right"
            className="w-4 h-4 text-gray-600 dark:text-gray-300"
          />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {resolvedWeekdayLabels.map((wd) => (
          <span
            key={wd}
            className="text-[11px] text-center text-gray-400 font-medium">
            {wd}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => (
          <span key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <Button
            type="button"
            key={day}
            onClick={() => onChange(new Date(viewYear, viewMonth, day))}
            className={`w-11 h-11 mx-auto rounded-full text-sm flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent cursor-pointer ${
              isSelected(day)
                ? "bg-landing-accent text-white font-bold"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
            }`}>
            {day}
          </Button>
        ))}
      </div>
    </div>
  );
};

/* ── List Dropdown ─────────────────────────────────────────── */
export const ListDropdown = ({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="py-2 min-w-50 max-h-60 overflow-y-auto">
    {items.map((item) => (
      <Button
        type="button"
        key={item}
        onClick={() => onChange(item)}
        className={`w-full min-h-11 text-left px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent cursor-pointer ${
          value === item
            ? "bg-landing-accent/10 text-landing-accent font-medium"
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
        }`}>
        {item}
      </Button>
    ))}
  </div>
);

/* ── Number Dropdown ───────────────────────────────────────── */
export const NumberDropdown = ({
  value,
  onChange,
  singleLabel,
  pluralLabel,
}: {
  value: number | null;
  onChange: (v: number) => void;
  singleLabel: string;
  pluralLabel: string;
}) => (
  <div className="py-2 min-w-45 max-h-60 overflow-y-auto">
    {PEOPLE_OPTIONS.map((num) => (
      <Button
        type="button"
        key={num}
        onClick={() => onChange(num)}
        className={`w-full min-h-11 text-left px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent cursor-pointer ${
          value === num
            ? "bg-landing-accent/10 text-landing-accent font-medium"
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
        }`}>
        {num} {num === 1 ? singleLabel : pluralLabel}
      </Button>
    ))}
  </div>
);

/* ── SelectField ───────────────────────────────────────────── */
export type SelectFieldProps = {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  rounded?: string;
  isOpen: boolean;
  onToggle: () => void;
  displayValue?: string;
  children?: React.ReactNode;
};

export const SelectField = ({
  icon,
  label,
  placeholder,
  rounded,
  isOpen,
  onToggle,
  displayValue,
  children,
}: SelectFieldProps) => (
  <div className="relative w-full h-full">
    <Button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-haspopup={children ? "listbox" : undefined}
      className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 min-h-11 bg-white dark:bg-slate-800 w-full text-left overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent cursor-pointer ${rounded ?? ""} ${
        isOpen ? "ring-2 ring-landing-accent/30" : ""
      }`}>
      <div className="relative w-4 h-4 md:w-6 md:h-6 shrink-0 flex items-center justify-center text-landing-accent">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 md:gap-1 w-full">
        <span suppressHydrationWarning className="text-[#333] dark:text-white font-semibold text-xs md:text-sm leading-tight truncate w-full block">
          {label}
        </span>
        <div className="flex min-w-0 items-center justify-between gap-1 w-full opacity-70">
          <span
            suppressHydrationWarning
            className={`text-[10px] md:text-xs font-normal truncate flex-1 ${
              displayValue ? "text-[#333] dark:text-gray-200" : "text-[#333] dark:text-gray-300 opacity-80"
            }`}>
            {displayValue || placeholder}
          </span>
          <Icon
            icon="heroicons-outline:chevron-down"
            className={`w-3 h-3 md:w-4 md:h-4 shrink-0 text-[#333] dark:text-gray-300 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
    </Button>

    {/* Dropdown panel */}
    {isOpen && children && (
      <div className="absolute top-full left-0 right-0 md:left-auto md:right-auto md:min-w-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 z-50">
        {children}
      </div>
    )}
  </div>
);
