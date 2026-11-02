"use client";

import { countryName } from "@/lib/places-utils";

interface CountryFilterProps {
  /** Country codes to offer, already sorted by display name. */
  countries: string[];
  /** The selected ISO 3166-1 alpha-2 code, or null for "All countries". */
  value: string | null;
  onChange: (country: string | null) => void;
}

/**
 * Country filter. There are only a few dozen countries, so a native select is
 * enough (the city list, with 500+ entries, is the type-to-search one). Picking
 * a country narrows the city filter to that country's cities.
 */
export function CountryFilter({ countries, value, onChange }: CountryFilterProps) {
  return (
    <select
      aria-label="Filter by country"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-8 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
    >
      <option value="">All countries</option>
      {countries.map((code) => (
        <option key={code} value={code}>
          {countryName(code)}
        </option>
      ))}
    </select>
  );
}
