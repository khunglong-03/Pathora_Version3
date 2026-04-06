"use client";

import React, { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/Icon";

export interface SearchableSelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

type SearchableSelectProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  error?: string;
  disabled?: boolean;
  className?: string;
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = "Search…",
  value,
  onChange,
  options,
  error,
  disabled,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative">
        {/* Trigger button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left ${
            error
              ? "border-danger-500 bg-white dark:bg-slate-800 text-danger-600 dark:text-danger-400"
              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-orange-400"}`}
        >
          <span className={selectedOption ? "text-slate-900 dark:text-white" : "text-slate-400"}>
            {selectedOption ? (
              <span>
                {selectedOption.label}
                {selectedOption.subLabel && (
                  <span className="ml-1 text-slate-500 text-xs">
                    — {selectedOption.subLabel}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-slate-400 italic">-- Select --</span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {selectedOption && !disabled && (
              <span
                onClick={handleClear}
                className="text-slate-400 hover:text-danger-500 transition-colors p-0.5"
                role="button"
                aria-label="Clear selection"
              >
                <Icon icon="heroicons:x-circle" className="size-4" />
              </span>
            )}
            <Icon
              icon="heroicons:chevron-down"
              className={`size-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400 text-center">
                  No results found
                </div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                      opt.value === value
                        ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                    {opt.subLabel && (
                      <span className="ml-1 text-slate-400 text-xs">{opt.subLabel}</span>
                    )}
                    {opt.value === value && (
                      <Icon icon="bi:check-lg" className="inline ml-2 size-3 text-orange-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-danger-500">{error}</p>
      )}
    </div>
  );
};

export default SearchableSelect;
