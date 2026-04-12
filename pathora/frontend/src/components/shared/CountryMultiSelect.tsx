"use client";

import React, { useState } from "react";

// Country data with ISO 3166-1 alpha-2 codes
export interface CountryInfo {
  code: string;
  name: string;
  continent: string;
}

export const COUNTRIES_BY_CONTINENT: Record<string, CountryInfo[]> = {
  Asia: [
    { code: "VN", name: "Vietnam", continent: "Asia" },
    { code: "TH", name: "Thailand", continent: "Asia" },
    { code: "MY", name: "Malaysia", continent: "Asia" },
    { code: "SG", name: "Singapore", continent: "Asia" },
    { code: "KH", name: "Cambodia", continent: "Asia" },
    { code: "LA", name: "Laos", continent: "Asia" },
    { code: "PH", name: "Philippines", continent: "Asia" },
    { code: "ID", name: "Indonesia", continent: "Asia" },
    { code: "MM", name: "Myanmar", continent: "Asia" },
    { code: "BN", name: "Brunei", continent: "Asia" },
    { code: "JP", name: "Japan", continent: "Asia" },
    { code: "KR", name: "South Korea", continent: "Asia" },
    { code: "CN", name: "China", continent: "Asia" },
    { code: "TW", name: "Taiwan", continent: "Asia" },
    { code: "HK", name: "Hong Kong", continent: "Asia" },
    { code: "IN", name: "India", continent: "Asia" },
  ],
  Europe: [
    { code: "GB", name: "United Kingdom", continent: "Europe" },
    { code: "FR", name: "France", continent: "Europe" },
    { code: "DE", name: "Germany", continent: "Europe" },
    { code: "IT", name: "Italy", continent: "Europe" },
    { code: "ES", name: "Spain", continent: "Europe" },
    { code: "NL", name: "Netherlands", continent: "Europe" },
    { code: "BE", name: "Belgium", continent: "Europe" },
    { code: "CH", name: "Switzerland", continent: "Europe" },
    { code: "AT", name: "Austria", continent: "Europe" },
    { code: "PT", name: "Portugal", continent: "Europe" },
    { code: "PL", name: "Poland", continent: "Europe" },
    { code: "CZ", name: "Czech Republic", continent: "Europe" },
    { code: "HU", name: "Hungary", continent: "Europe" },
    { code: "GR", name: "Greece", continent: "Europe" },
    { code: "SE", name: "Sweden", continent: "Europe" },
    { code: "NO", name: "Norway", continent: "Europe" },
    { code: "DK", name: "Denmark", continent: "Europe" },
    { code: "FI", name: "Finland", continent: "Europe" },
  ],
  Africa: [
    { code: "ZA", name: "South Africa", continent: "Africa" },
    { code: "EG", name: "Egypt", continent: "Africa" },
    { code: "MA", name: "Morocco", continent: "Africa" },
    { code: "NG", name: "Nigeria", continent: "Africa" },
    { code: "KE", name: "Kenya", continent: "Africa" },
    { code: "TZ", name: "Tanzania", continent: "Africa" },
    { code: "GH", name: "Ghana", continent: "Africa" },
  ],
  NorthAmerica: [
    { code: "US", name: "United States", continent: "NorthAmerica" },
    { code: "CA", name: "Canada", continent: "NorthAmerica" },
    { code: "MX", name: "Mexico", continent: "NorthAmerica" },
  ],
  SouthAmerica: [
    { code: "BR", name: "Brazil", continent: "SouthAmerica" },
    { code: "AR", name: "Argentina", continent: "SouthAmerica" },
    { code: "CL", name: "Chile", continent: "SouthAmerica" },
    { code: "CO", name: "Colombia", continent: "SouthAmerica" },
    { code: "PE", name: "Peru", continent: "SouthAmerica" },
    { code: "EC", name: "Ecuador", continent: "SouthAmerica" },
  ],
  Oceania: [
    { code: "AU", name: "Australia", continent: "Oceania" },
    { code: "NZ", name: "New Zealand", continent: "Oceania" },
    { code: "PG", name: "Papua New Guinea", continent: "Oceania" },
    { code: "FJ", name: "Fiji", continent: "Oceania" },
  ],
};

export const ALL_COUNTRIES = Object.values(COUNTRIES_BY_CONTINENT).flat();

// Parse CSV string to array of country codes
export function parseCountryCodes(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length === 2);
}

// Format array of country codes to CSV string
export function formatCountryCodes(codes: string[]): string {
  return codes.map((c) => c.trim().toUpperCase()).filter(Boolean).join(",");
}

interface CountryMultiSelectProps {
  selected: string[];
  onChange: (codes: string[]) => void;
  continent?: string;
  placeholder?: string;
  className?: string;
}

export function CountryMultiSelect({
  selected,
  onChange,
  continent,
  placeholder = "Chọn quốc gia...",
  className = "",
}: CountryMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const countries = continent
    ? (COUNTRIES_BY_CONTINENT[continent] ?? [])
    : ALL_COUNTRIES;

  const filtered = search
    ? countries.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : countries;

  const toggleCountry = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const selectedCountries = selected
    .map((code) => ALL_COUNTRIES.find((c) => c.code === code))
    .filter(Boolean) as CountryInfo[];

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[40px] px-3 py-2 text-left rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {selected.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedCountries.map((country) => (
              <span
                key={country.code}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 rounded text-gray-700"
              >
                {country.code}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCountry(country.code);
                  }}
                  className="ml-0.5 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm quốc gia..."
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy</div>
            ) : (
              filtered.map((country) => (
                <label
                  key={country.code}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(country.code)}
                    onChange={() => toggleCountry(country.code)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-xs font-medium w-8">{country.code}</span>
                  <span className="flex-1">{country.name}</span>
                </label>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
