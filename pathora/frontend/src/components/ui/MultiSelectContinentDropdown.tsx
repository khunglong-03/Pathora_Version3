'use client';

import React from 'react';
import { useTranslation } from "react-i18next";
import { CONTINENT_TRANSLATION_KEYS, SUPPORTED_CONTINENT_CODES } from "@/constants/continents";

interface MultiSelectContinentDropdownProps {
  selected: string[];
  onChange: (continents: string[]) => void;
  className?: string;
}

export function MultiSelectContinentDropdown({
  selected,
  onChange,
  className = '',
}: MultiSelectContinentDropdownProps) {
  const { t } = useTranslation();

  const toggleContinent = (continent: string) => {
    if (selected.includes(continent)) {
      onChange(selected.filter(c => c !== continent));
    } else {
      onChange([...selected, continent]);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {SUPPORTED_CONTINENT_CODES.map(continent => (
        <label key={continent} className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(continent)}
            onChange={() => toggleContinent(continent)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">{t(CONTINENT_TRANSLATION_KEYS[continent])}</span>
        </label>
      ))}
    </div>
  );
}
