"use client";

import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "react-i18next";

interface LocationForm {
  locationName: string;
  enLocationName: string;
}

interface LocationComboboxProps {
  value: string;
  customValue: string;
  enCustomValue: string;
  locations: LocationForm[];
  onSelect: (index: string) => void;
  onCustomChange: (value: string) => void;
  onEnCustomChange: (value: string) => void;
  error?: string;
}

export const LocationCombobox = ({
  value,
  customValue,
  enCustomValue,
  locations,
  onSelect,
  onCustomChange,
  onEnCustomChange,
  error,
}: LocationComboboxProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const isCustomMode = value === "";
  const selectedLocation = value !== "" && parseInt(value) < locations.length
    ? locations[parseInt(value)]
    : null;

  const isDangling = value !== "" && parseInt(value) >= locations.length;

  const filteredLocations = locations.filter((loc) =>
    loc.locationName.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFilter("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayValue = isCustomMode
    ? customValue || t("tourAdmin.itineraries.customLocation", "Custom location...")
    : selectedLocation?.locationName
    || (isDangling ? t("tourAdmin.validation.locationRemoved", "Location removed") : "");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2 py-1.5 text-xs rounded-lg border text-left bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition ${
          error || isDangling
            ? "border-red-400 dark:border-red-500"
            : "border-slate-300 dark:border-slate-600"
        }`}
      >
        <span className={!displayValue ? "text-slate-400" : ""}>{displayValue}</span>
        {isOpen ? <Icon icon="heroicons:chevron-up" className="w-3 h-3 inline float-right mt-0.5" /> : <Icon icon="heroicons:chevron-down" className="w-3 h-3 inline float-right mt-0.5" />}
      </button>

      {(error || isDangling) && (
        <p className="text-red-500 text-xs mt-0.5">
          {isDangling ? t("tourAdmin.validation.locationRemoved", "Referenced location was removed") : error}
        </p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-1 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t("tourAdmin.itineraries.searchLocation", "Search...")}
              className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              autoFocus
            />
          </div>

          <div className="max-h-40 overflow-y-auto">
            {filteredLocations.length === 0 && filter && (
              <div className="px-3 py-2 text-xs text-slate-400 italic">
                {t("tourAdmin.itineraries.noLocationMatch", "No locations match")}
              </div>
            )}

            {filteredLocations.map((loc) => {
              const actualIndex = locations.indexOf(loc);
              return (
                <button
                  key={actualIndex}
                  type="button"
                  onClick={() => { onSelect(String(actualIndex)); setIsOpen(false); setFilter(""); }}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                >
                  {loc.locationName}
                  {loc.enLocationName && (
                    <span className="ml-1 text-slate-400">/ {loc.enLocationName}</span>
                  )}
                </button>
              );
            })}

            <div className="border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { onSelect(""); setIsOpen(false); setFilter(""); }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 italic"
              >
                {t("tourAdmin.itineraries.customLocation", "Custom location...")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCustomMode && (
        <div className="mt-1 grid grid-cols-2 gap-1">
          <input
            type="text"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={t("tourAdmin.itineraries.locationVI", "Location (VI)")}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={enCustomValue}
            onChange={(e) => onEnCustomChange(e.target.value)}
            placeholder={t("tourAdmin.itineraries.locationEN", "Location (EN)")}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      )}
    </div>
  );
};
