"use client";

import React from "react";
import CheckImage from "@/assets/images/icon/ck-white.svg";

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
  activeClass = "ring-black-500 bg-slate-900 dark:bg-slate-700 dark:ring-slate-700",
  className = "",
}: CheckboxProps) => {
  return (
    <label
      className={`flex items-center ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
      htmlFor={id}
    >
      <input
        type="checkbox"
        className="sr-only"
        name={name}
        checked={value}
        onChange={onChange}
        id={id}
        disabled={disabled}
        aria-checked={value}
      />
      <span
        className={`relative inline-flex h-4 w-4 flex-none rounded border border-slate-100 transition-all duration-150 ltr:mr-3 rtl:ml-3 dark:border-slate-800 ${
          value
            ? `${activeClass} ring-2 ring-offset-2 dark:ring-offset-slate-800`
            : "bg-slate-100 dark:border-slate-600 dark:bg-slate-600"
        }`}
        aria-hidden="true"
      >
        {value && (
          <img
            src={CheckImage.src}
            alt=""
            className="m-auto block h-2.5 w-2.5"
          />
        )}
      </span>
      <span
        className={`text-sm leading-6 text-slate-500 capitalize dark:text-slate-400 ${className}`}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;
