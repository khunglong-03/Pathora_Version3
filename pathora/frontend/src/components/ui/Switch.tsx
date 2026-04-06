"use client";

import React from "react";
import Icon from "@/components/ui/Icon";

type SwitchProps = {
  prevIcon?: string;
  nextIcon?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  value?: boolean;
  onChange?: (value: boolean) => void;
  activeClass?: string;
  wrapperClass?: string;
  labelClass?: string;
  badge?: boolean;
  ariaLabel?: string;
};

const Switch = ({
  prevIcon,
  nextIcon,
  label,
  id,
  disabled,
  value,
  onChange,
  activeClass = "bg-slate-900 dark:bg-slate-900",
  wrapperClass = "",
  labelClass = "text-slate-500 dark:text-slate-400 text-sm leading-6",
  badge,
  ariaLabel,
}: SwitchProps) => {
  return (
    <div>
      <label
        className={`flex items-center ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${wrapperClass}`}
        htmlFor={id}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={value}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          id={id}
          aria-checked={value}
          aria-label={ariaLabel ?? label}
        />
        <div
          className={`relative inline-flex h-6 w-11.5 items-center rounded-full transition-colors duration-150 ltr:mr-3 rtl:ml-3 ${
            value ? activeClass : "bg-secondary-500"
          }`}
          role="switch"
          aria-hidden="true"
        >
          {badge && value && (
            <span className="absolute top-1/2 left-1 -translate-y-1/2 font-bold tracking-[1px] text-white capitalize">
              {prevIcon ? (
                <Icon icon={prevIcon} />
              ) : (
                <span className="text-[9px]">on</span>
              )}
            </span>
          )}
          {badge && !value && (
            <span className="absolute top-1/2 right-1 -translate-y-1/2 font-bold tracking-[1px] text-slate-900 capitalize">
              {nextIcon ? (
                <Icon icon={nextIcon} />
              ) : (
                <span className="text-[9px]">Off</span>
              )}
            </span>
          )}

          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-150 ${
              value
                ? "ltr:translate-x-6 rtl:-translate-x-6"
                : "ltr:translate-x-0.5 rtl:-translate-x-0.5"
            }`}
          />
        </div>
        {label && <span className={labelClass}>{label}</span>}
      </label>
    </div>
  );
};

export default Switch;
