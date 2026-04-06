"use client";

import React from "react";

type RadioProps = {
  label?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeClass?: string;
  wrapperClass?: string;
  labelClass?: string;
  checked?: boolean;
  className?: string;
};

const Radio = ({
  label,
  id,
  name,
  disabled,
  value,
  onChange,
  activeClass = "ring-slate-500 dark:ring-slate-400",
  wrapperClass = " ",
  labelClass = "text-slate-500 dark:text-slate-400 text-sm leading-6",
  checked,
  className = "h-4.5 w-4.5",
}: RadioProps) => {
  return (
    <div>
      <label
        className={
          `flex items-center ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer "
          }` +
          "" +
          wrapperClass
        }
        id={id}
      >
        <input
          type="radio"
          className="hidden"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span
          className={`relative inline-flex flex-none rounded-full border bg-white transition-all duration-150 ltr:mr-3 rtl:ml-3 dark:bg-slate-500 ${className} ${
            checked
              ? activeClass +
                " border-slate-700 ring-6 ring-offset-2 ring-inset dark:ring-offset-4 dark:ring-offset-slate-600"
              : "border-slate-400 dark:border-slate-600 dark:ring-slate-700"
          } `}
        ></span>
        {label && <span className={labelClass}>{label}</span>}
      </label>
    </div>
  );
};

export default Radio;
