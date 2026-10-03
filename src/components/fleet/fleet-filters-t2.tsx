'use client';

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
 *  edits — the listing hook does the actual filtering — rendered as
 *  flat chip groups in the template's own language instead of the
 *  template-1 popover. */
export function FleetFiltersT2({ filters, options, onChange, activeCount }: FleetFiltersT2Props) {
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

      {activeCount > 0 ? (
        <button type="button" className={styles.filterClear} onClick={() => onChange(INITIAL_FILTERS)}>
          <Dyn>Clear filters</Dyn> ({activeCount})
        </button>
      ) : null}
    </div>
  );
}
