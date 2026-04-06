"use client";

import React from "react";
import Icon from "@/components/ui/Icon";

type TextareaProps = {
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
  cols?: number;
  row?: number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
};

const Textarea = ({
  label,
  placeholder,
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
  cols,
  row = 3,
  onChange,
  onBlur,
  ...rest
}: TextareaProps) => {
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
        <textarea
          {...(register && name ? register(name) : {})}
          {...rest}
          name={name}
          className={`form-control py-2 ${error ? "has-error" : ""} ${className}`}
          placeholder={placeholder}
          readOnly={readonly}
          disabled={disabled}
          id={id}
          cols={cols}
          rows={row}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        <div className="absolute top-1/2 flex -translate-y-1/2 space-x-1 text-xl ltr:right-3.5 rtl:left-3.5 rtl:space-x-reverse">
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

export default Textarea;
