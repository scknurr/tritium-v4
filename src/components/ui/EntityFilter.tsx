import React from 'react';
import { Select } from 'flowbite-react';

export type FilterOption = {
  value: string;
  label: string;
};

interface EntityFilterProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function EntityFilter({ options, value, onChange }: EntityFilterProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-48"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}