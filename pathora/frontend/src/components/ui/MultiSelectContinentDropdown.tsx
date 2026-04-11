'use client';

import React from 'react';

const CONTINENT_OPTIONS = [
  'Asia',
  'Europe',
  'Africa',
  'NorthAmerica',
  'SouthAmerica',
  'Oceania',
  'Antarctica',
];

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
  const toggleContinent = (continent: string) => {
    if (selected.includes(continent)) {
      onChange(selected.filter(c => c !== continent));
    } else {
      onChange([...selected, continent]);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {CONTINENT_OPTIONS.map(continent => (
        <label key={continent} className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(continent)}
            onChange={() => toggleContinent(continent)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">{continent}</span>
        </label>
      ))}
    </div>
  );
}
