'use client';

import { useState } from 'react';
import { INITIAL_FILTERS, type FilterOptions, type FilterState } from './fleet-filters';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

interface FleetFiltersT2Props {
  filters: FilterState;
  options: FilterOptions;
  onChange: (next: FilterState) => void;
  activeCount: number;
}

/** Template-2 filter rail. Same FilterState the template-1 toolbar
 *  edits — the listing hook does the actual filtering.
 *
 *  Collapsed behind a toggle at every width: expanded, the chip groups
 *  push the fleet grid a long way down the page on a phone and below
 *  the fold on a laptop. */
export function FleetFiltersT2({ filters, options, onChange, activeCount }: FleetFiltersT2Props) {
  const [open, setOpen] = useState(false);

  const toggle = <T extends string | number>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const groups: {
    key: 'vehicleType' | 'make' | 'color';
    label: string;
    values: string[];
  }[] = [
    { key: 'vehicleType', label: 'Type', values: options.vehicleTypes },
    { key: 'make', label: 'Make', values: options.makes },
    { key: 'color', label: 'Colour', values: options.colors },
  ];

  const hasAnything =
    groups.some((g) => g.values.length > 0) || options.seats.length > 0;
  if (!hasAnything) return null;

  return (
    <div className={styles.filterBlock}>
      <div className={styles.filterBar}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={`${styles.btn} ${styles.btnGhost} ${styles.filterToggle}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M7 12h10M10 18h4" />
          </svg>
          <Dyn>Filters</Dyn>
          {activeCount > 0 ? <span className={styles.filterCount}>{activeCount}</span> : null}
        </button>

        {activeCount > 0 ? (
          <button type="button" className={styles.filterClear} onClick={() => onChange(INITIAL_FILTERS)}>
            <Dyn>Clear filters</Dyn>
          </button>
        ) : null}
      </div>

      {open ? (
        <div className={styles.filterRail}>
          {groups.map((group) =>
            group.values.length > 0 ? (
              <div className={styles.filterGroup} key={group.key}>
                <span className={styles.filterGroupLabel}>
                  <Dyn>{group.label}</Dyn>
                </span>
                <div className={styles.filterChips}>
                  {group.values.map((value) => {
                    const active = filters[group.key].includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange({ ...filters, [group.key]: toggle(filters[group.key], value) })}
                        className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
                      >
                        <Dyn>{value}</Dyn>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null,
          )}

          {options.seats.length > 0 ? (
            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>
                <Dyn>Seats</Dyn>
              </span>
              <div className={styles.filterChips}>
                {options.seats.map((seat) => {
                  const active = filters.seats.includes(seat);
                  return (
                    <button
                      key={seat}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChange({ ...filters, seats: toggle(filters.seats, seat) })}
                      className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
                    >
                      {seat}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className={styles.filterGroup}>
            <span className={styles.filterGroupLabel}>
              <Dyn>Price per day</Dyn>
            </span>
            <div className={styles.filterPrice}>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Min"
                value={filters.minPrice ?? ''}
                onChange={(e) =>
                  onChange({ ...filters, minPrice: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
              <span aria-hidden="true">—</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Max"
                value={filters.maxPrice ?? ''}
                onChange={(e) =>
                  onChange({ ...filters, maxPrice: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
