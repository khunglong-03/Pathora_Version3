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
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative">
        {/* Trigger button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-left ${
            error
              ? "border-destructive bg-background text-destructive"
              : "border-input bg-card text-foreground"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}`}
        >
          <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
            {selectedOption ? (
              <span>
                {selectedOption.label}
                {selectedOption.subLabel && (
                  <span className="ml-1 text-muted-foreground text-xs">
                    — {selectedOption.subLabel}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground italic">-- Select --</span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {selectedOption && !disabled && (
              <span
                onClick={handleClear}
                className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                role="button"
                aria-label="Clear selection"
              >
                <Icon icon="heroicons:x-circle" className="size-4" />
              </span>
            )}
            <Icon
              icon="heroicons:chevron-down"
              className={`size-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-card border border-input rounded-lg shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-input">
              <div className="relative">
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
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
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                    {opt.subLabel && (
                      <span className="ml-1 text-muted-foreground text-xs">{opt.subLabel}</span>
                    )}
                    {opt.value === value && (
                      <Icon icon="bi:check-lg" className="inline ml-2 size-3 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

export default SearchableSelect;
