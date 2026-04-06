"use client";

import React, { Fragment } from "react";
import Icon from "@/components/ui/Icon";

type SelectOption = { value: string; label: string } | string;

type SelectProps = {
  label?: string;
  placeholder?: string;
  classLabel?: string;
  className?: string;
  classGroup?: string;
  register?: (name: string, options?: Record<string, unknown>) => Record<string, unknown>;
  name?: string;
  readonly?: boolean;
  value?: string;
  error?: { message?: string };
  icon?: string;
  disabled?: boolean;
  id?: string;
  horizontal?: boolean;
  validate?: string;
  msgTooltip?: boolean;
  description?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  defaultValue?: string;
  size?: number;
  [key: string]: unknown;
};

const Select = ({
  label,
  placeholder = "Select option…",
  classLabel = "form-label",
  className = "",
  classGroup = "",
  register,
  name,
  readonly,
  value,
  error,
  icon,
  disabled,
  id,
  horizontal,
  validate,
  msgTooltip,
  description,
  onChange,
  onBlur,
  options,
  defaultValue,
  size,
  ...rest
}: SelectProps) => {
  const safeOptions = options || Array(3).fill("option");

  return (
    <div
      className={`fromGroup ${error ? "has-error" : ""} ${
        horizontal ? "flex" : ""
      } ${validate ? "is-valid" : ""}`}
    >
      {label && (
        <label
          htmlFor={id}
          className={`block capitalize ${classLabel} ${
            horizontal ? "mr-6 w-15 flex-0 break-words md:w-25" : ""
          }`}
        >
          {label}
        </label>
      )}
      <div className={`relative ${horizontal ? "flex-1" : ""}`}>
        <select
          onChange={onChange}
          onBlur={onBlur}
          {...(register && name ? register(name) : {})}
          {...rest}
          name={name}
          className={`form-control appearance-none py-2 ${
            error ? "has-error" : ""
          } ${className} bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200`}
          disabled={disabled}
          id={id}
          value={value}
          size={size}
          defaultValue={defaultValue}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {safeOptions.map((option, i) => (
            <Fragment key={i}>
              {typeof option === "object" &&
              option !== null &&
              "value" in option &&
              "label" in option ? (
                <option value={option.value}>{option.label}</option>
              ) : (
                <option value={option}>{option}</option>
              )}
            </Fragment>
          ))}
        </select>

        <div className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 space-x-1 text-xl ltr:right-3.5 rtl:left-3.5 rtl:space-x-reverse">
          <span className="relative -right-2 inline-block text-slate-900 dark:text-slate-300">
            <Icon icon="heroicons:chevron-down" />
          </span>
          {error && (
            <span className="text-danger-500">
              <Icon icon="heroicons-outline:information-circle" />
            </span>
          )}
          {validate && (
            <span className="text-success-500">
              <Icon icon="bi:check-lg" />
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className={`mt-2 ${
            msgTooltip
              ? "bg-danger-500 inline-block rounded-sm px-2 py-1 text-[10px] text-white"
              : "text-danger-500 block text-sm"
          }`}
        >
          {error.message}
        </div>
      )}
      
      {validate && (
        <div
          className={`mt-2 ${
            msgTooltip
              ? "bg-success-500 inline-block rounded-sm px-2 py-1 text-[10px] text-white"
              : "text-success-500 block text-sm"
          }`}
        >
          {validate}
        </div>
      )}
      
      {description && <span className="input-description">{description}</span>}
    </div>
  );
};

export default Select;
