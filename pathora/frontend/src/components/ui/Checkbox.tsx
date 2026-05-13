"use client";

import React from "react";
import { Icon } from "@/components/ui";

type CheckboxProps = {
  id?: string;
  disabled?: boolean;
  label?: React.ReactNode;
  value?: boolean;
  name?: string;
  onChange?: () => void;
  activeClass?: string;
  className?: string;
};

const Checkbox = ({
  id,
  disabled,
  label,
  value,
  name,
  onChange,
  activeClass = "bg-zinc-900 border-zinc-900 ring-zinc-900",
  className = "",
}: CheckboxProps) => {
  return (
    <label
      className={`relative flex items-start group ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
      htmlFor={id}
    >
      <input
        type="checkbox"
        className="peer absolute opacity-0 w-0 h-0"
        name={name}
        checked={value}
        onChange={onChange}
        id={id}
        disabled={disabled}
        aria-checked={value}
      />
      <span
        className={`relative inline-flex size-5 mt-0.5 flex-none rounded-md border transition-all duration-200 ease-out ltr:mr-3 rtl:ml-3 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white ${
          value
            ? `${activeClass} shadow-sm`
            : "bg-white border-slate-300 group-hover:border-zinc-400 group-hover:bg-slate-50"
        }`}
        aria-hidden="true"
      >
        <Icon 
          icon="heroicons:check" 
          className={`absolute inset-0 m-auto size-3.5 text-white transition-transform duration-200 ease-out ${
            value ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`} 
        />
      </span>
      <span
        className={`text-sm leading-6 text-slate-600 font-medium select-none ${className}`}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;
