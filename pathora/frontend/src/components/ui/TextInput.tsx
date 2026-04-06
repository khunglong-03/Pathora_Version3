"use client";

import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import Cleave from "cleave.js/react";
import "cleave.js/dist/addons/cleave-phone.us";

type TextInputProps = {
  type?: string;
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
  isMask?: boolean;
  msgTooltip?: boolean;
  description?: string;
  hasicon?: boolean;
  autocomplete?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  options?: Record<string, unknown>;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  [key: string]: unknown;
};

const TextInput = ({
  type,
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
  isMask,
  msgTooltip,
  description,
  hasicon,
  autocomplete,
  onChange,
  onBlur,
  options,
  onFocus,
  defaultValue,
  ...rest
}: TextInputProps) => {
  const [open, setOpen] = useState(false);
  const inputType = type === "password" && open ? "text" : type;

  const getAutocomplete = () => {
    if (autocomplete) return autocomplete;
    if (type === "email") return "email";
    if (type === "password") return "current-password";
    if (name === "username") return "username";
    return "off";
  };

  const renderInput = () => {
    const inputClasses = `form-control w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:shadow-sm ${error ? "has-error ring-destructive border-destructive focus-visible:ring-destructive" : ""} ${className}`;

    if (isMask) {
      return (
        <Cleave
          {...(register && name ? register(name) : {})}
          {...rest}
          name={name}
          placeholder={placeholder}
          options={options}
          className={inputClasses}
          onFocus={onFocus}
          id={id}
          readOnly={readonly}
          disabled={disabled}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      );
    }

    return (
      <input
        type={inputType}
        {...(register && name ? register(name) : {})}
        {...rest}
        name={name}
        className={inputClasses}
        placeholder={placeholder}
        readOnly={readonly}
        defaultValue={defaultValue}
        disabled={disabled}
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={getAutocomplete()}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    );
  };

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
        {renderInput()}

        <div className="absolute top-1/2 flex -translate-y-1/2 space-x-1 text-xl ltr:right-3.5 rtl:left-3.5 rtl:space-x-reverse">
          {hasicon && type === "password" && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded transition-colors"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Hide password" : "Show password"}
            >
              <Icon icon={open ? "heroicons-outline:eye" : "heroicons-outline:eye-off"} />
            </button>
          )}

          {error && (
            <span className="text-destructive" aria-hidden="true">
              <Icon icon="heroicons-outline:information-circle" />
            </span>
          )}
          {validate && (
            <span className="text-green-500" aria-hidden="true">
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
              ? "bg-destructive inline-block rounded-sm px-2 py-1 text-[10px] text-destructive-foreground"
              : "text-destructive block text-sm font-medium"
          }`}
        >
          {error.message}
        </div>
      )}
      
      {validate && (
        <div
          className={`mt-2 ${
            msgTooltip
              ? "bg-green-500 inline-block rounded-sm px-2 py-1 text-[10px] text-white"
              : "text-green-500 block text-sm font-medium"
          }`}
        >
          {validate}
        </div>
      )}
      
      {description && (
        <span className="input-description">{description}</span>
      )}
    </div>
  );
};

export default TextInput;
