"use client";

import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import Cleave from "cleave.js/react";
import "cleave.js/dist/addons/cleave-phone.us";

type InputGroupProps = {
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
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  merged?: boolean;
  append?: React.ReactNode;
  prepend?: React.ReactNode;
  options?: Record<string, unknown>;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

const InputGroup = ({
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
  onChange,
  merged,
  append,
  prepend,
  options,
  onFocus,
  ...rest
}: InputGroupProps) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(!open);
  };

  return (
    <div className={` ${horizontal ? "flex" : ""} ${merged ? "merged" : ""} `}>
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
      <div
        className={`inputGroup flex items-stretch rounded-lg overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary focus-within:shadow-sm ${append ? "has-append" : ""} ${prepend ? "has-prepend" : ""} ${error ? "is-invalid" : ""} ${validate ? "is-valid" : ""} ${horizontal ? "flex-1" : ""} `}
      >
        {/* prepend*/}
        {prepend && (
          <span className="input-group-addon flex-none">
            <div className="input-group-text prepend-slot h-full">
              {prepend}
            </div>
          </span>
        )}
        <div className="flex-1">
          <div
            className={`fromGroup2 relative ${error ? "has-error" : ""} ${validate ? "is-valid" : ""} `}
          >
            {name && !isMask && (
              <input
                type={type === "password" && open === true ? "text" : type}
                {...(register ? register(name) : {})}
                {...rest}
                className={`${
                  error ? "has-error" : " "
                } input-group-control block w-full py-2 focus:outline-hidden ${className} `}
                placeholder={placeholder}
                readOnly={readonly}
                disabled={disabled}
                id={id}
                onChange={onChange}
              />
            )}
            {!name && !isMask && (
              <input
                type={type === "password" && open === true ? "text" : type}
                className={`input-group-control block w-full py-2 focus:outline-hidden ${className}`}
                placeholder={placeholder}
                readOnly={readonly}
                disabled={disabled}
                onChange={onChange}
                id={id}
              />
            )}
            {name && isMask && (
              <Cleave
                {...(register ? register(name) : {})}
                {...rest}
                placeholder={placeholder}
                options={options}
                className={`${
                  error ? "has-error" : " "
                } input-group-control w-full py-2 ${className} `}
                onFocus={onFocus}
                id={id}
                readOnly={readonly}
                disabled={disabled}
                onChange={onChange}
              />
            )}
            {!name && isMask && (
              <Cleave
                placeholder={placeholder}
                options={options}
                className={`${
                  error ? "has-error" : " "
                } input-group-control w-full py-2 ${className} `}
                onFocus={onFocus}
                id={id}
                readOnly={readonly}
                disabled={disabled}
                onChange={onChange}
              />
            )}
            {/* icon */}
            <div className="absolute top-1/2 flex -translate-y-1/2 space-x-1 text-xl ltr:right-3.5 rtl:left-3.5 rtl:space-x-reverse">
              {hasicon && (
                <span
                  className="text-secondary-500 cursor-pointer"
                  onClick={handleOpen}
                >
                  {open && type === "password" && (
                    <Icon icon="heroicons-outline:eye" />
                  )}
                  {!open && type === "password" && (
                    <Icon icon="heroicons-outline:eye-off" />
                  )}
                </span>
              )}

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
        </div>
        {/* append*/}
        {append && (
          <span className="input-group-addon right flex-none">
            <div className="input-group-text append-slot h-full">{append}</div>
          </span>
        )}
      </div>
      {/* error and success message*/}
      {error && (
        <div
          className={`mt-2 ${
            msgTooltip
              ? "bg-danger-500 inline-block rounded-sm px-2 py-1 text-[10px] text-white"
              : "text-danger-500 block text-sm"
          }`}
        >
          {error.message}
        </div>
      )}
      {/* validated and success message*/}
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
      {/* only description */}
      {description && <span className="input-description">{description}</span>}
    </div>
  );
};

export default InputGroup;
