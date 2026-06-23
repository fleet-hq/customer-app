'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface FilterState {
  vehicleType: string[];
  make: string[];
  color: string[];
  seats: number[];
  minPrice: number | null;
  maxPrice: number | null;
}

export const INITIAL_FILTERS: FilterState = {
  vehicleType: [],
  make: [],
  color: [],
  seats: [],
  minPrice: null,
  maxPrice: null,
};

export interface FilterOptions {
  vehicleTypes: string[];
  makes: string[];
  colors: string[];
  seats: number[];
}

export function activeFilterCount(filters: FilterState): number {
  return (
    filters.vehicleType.length +
    filters.make.length +
    filters.color.length +
    filters.seats.length +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0)
  );
}

interface FleetFiltersProps {
  filters: FilterState;
  options: FilterOptions;
  onChange: (filters: FilterState) => void;
}

export function FleetFilters({ filters, options, onChange }: FleetFiltersProps) {
  const toggle = useCallback(
    <T extends string | number>(
      key: 'vehicleType' | 'make' | 'color' | 'seats',
      value: T,
    ) => {
      const current = filters[key] as T[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange({ ...filters, [key]: next });
    },
    [filters, onChange],
  );

  const count = activeFilterCount(filters);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold tracking-[0.05em] text-faint uppercase">
          Filters
        </span>
        {count > 0 && (
          <button
            type="button"
            onClick={() => onChange(INITIAL_FILTERS)}
            className="text-[12.5px] font-medium text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {options.vehicleTypes.length > 0 && (
        <ChipGroup
          label="Type"
          values={options.vehicleTypes}
          selected={filters.vehicleType}
          onToggle={(v) => toggle('vehicleType', v)}
        />
      )}

      {options.makes.length > 0 && (
        <ChipGroup
          label="Make"
          values={options.makes}
          selected={filters.make}
          onToggle={(v) => toggle('make', v)}
        />
      )}

      {options.colors.length > 0 && (
        <ChipGroup
          label="Color"
          values={options.colors}
          selected={filters.color}
          onToggle={(v) => toggle('color', v)}
        />
      )}

      {options.seats.length > 0 && (
        <ChipGroup
          label="Seats"
          values={options.seats}
          selected={filters.seats}
          onToggle={(v) => toggle('seats', v)}
        />
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium text-faint">Price per day</span>
        <div className="flex items-center gap-2">
          <PriceInput
            placeholder="Min"
            value={filters.minPrice}
            onChange={(v) => onChange({ ...filters, minPrice: v })}
          />
          <span className="text-xs text-faint">—</span>
          <PriceInput
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(v) => onChange({ ...filters, maxPrice: v })}
          />
        </div>
      </div>
    </div>
  );
}

interface ChipGroupProps<T extends string | number> {
  label: string;
  values: T[];
  selected: T[];
  onToggle: (value: T) => void;
}

function ChipGroup<T extends string | number>({ label, values, selected, onToggle }: ChipGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium text-faint">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => {
          const active = (selected as Array<string | number>).includes(v);
          return (
            <button
              key={String(v)}
              type="button"
              onClick={() => onToggle(v)}
              className={cn(
                'rounded-full px-3 py-[6px] text-[12.5px] font-medium transition-colors',
                active
                  ? 'border border-primary bg-primary text-white'
                  : 'border border-line text-label hover:bg-primary-soft hover:text-secondary',
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface PriceInputProps {
  placeholder: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

function PriceInput({ placeholder, value, onChange }: PriceInputProps) {
  return (
    <div className="flex items-center gap-1 rounded-[9px] border border-line bg-white px-3 py-[9px]">
      <span className="text-xs text-faint">$</span>
      <input
        type="number"
        min={0}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-16 border-none bg-transparent text-sm text-ink outline-none placeholder:text-faint"
      />
    </div>
  );
}
