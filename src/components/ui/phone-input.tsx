'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/use-click-outside';
import { ChevronDown } from '@/components/ui/icons';

export interface Country {
  iso2: string;
  name: string;
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  { iso2: 'us', name: 'United States', dialCode: '1' },
  { iso2: 'ca', name: 'Canada', dialCode: '1' },
  { iso2: 'gb', name: 'United Kingdom', dialCode: '44' },
  { iso2: 'au', name: 'Australia', dialCode: '61' },
  { iso2: 'ae', name: 'United Arab Emirates', dialCode: '971' },
  { iso2: 'af', name: 'Afghanistan', dialCode: '93' },
  { iso2: 'al', name: 'Albania', dialCode: '355' },
  { iso2: 'dz', name: 'Algeria', dialCode: '213' },
  { iso2: 'ar', name: 'Argentina', dialCode: '54' },
  { iso2: 'am', name: 'Armenia', dialCode: '374' },
  { iso2: 'at', name: 'Austria', dialCode: '43' },
  { iso2: 'az', name: 'Azerbaijan', dialCode: '994' },
  { iso2: 'bh', name: 'Bahrain', dialCode: '973' },
  { iso2: 'bd', name: 'Bangladesh', dialCode: '880' },
  { iso2: 'by', name: 'Belarus', dialCode: '375' },
  { iso2: 'be', name: 'Belgium', dialCode: '32' },
  { iso2: 'bo', name: 'Bolivia', dialCode: '591' },
  { iso2: 'ba', name: 'Bosnia and Herzegovina', dialCode: '387' },
  { iso2: 'br', name: 'Brazil', dialCode: '55' },
  { iso2: 'bg', name: 'Bulgaria', dialCode: '359' },
  { iso2: 'kh', name: 'Cambodia', dialCode: '855' },
  { iso2: 'cm', name: 'Cameroon', dialCode: '237' },
  { iso2: 'cl', name: 'Chile', dialCode: '56' },
  { iso2: 'cn', name: 'China', dialCode: '86' },
  { iso2: 'co', name: 'Colombia', dialCode: '57' },
  { iso2: 'cr', name: 'Costa Rica', dialCode: '506' },
  { iso2: 'hr', name: 'Croatia', dialCode: '385' },
  { iso2: 'cy', name: 'Cyprus', dialCode: '357' },
  { iso2: 'cz', name: 'Czech Republic', dialCode: '420' },
  { iso2: 'dk', name: 'Denmark', dialCode: '45' },
  { iso2: 'do', name: 'Dominican Republic', dialCode: '1' },
  { iso2: 'ec', name: 'Ecuador', dialCode: '593' },
  { iso2: 'eg', name: 'Egypt', dialCode: '20' },
  { iso2: 'sv', name: 'El Salvador', dialCode: '503' },
  { iso2: 'ee', name: 'Estonia', dialCode: '372' },
  { iso2: 'et', name: 'Ethiopia', dialCode: '251' },
  { iso2: 'fi', name: 'Finland', dialCode: '358' },
  { iso2: 'fr', name: 'France', dialCode: '33' },
  { iso2: 'ge', name: 'Georgia', dialCode: '995' },
  { iso2: 'de', name: 'Germany', dialCode: '49' },
  { iso2: 'gh', name: 'Ghana', dialCode: '233' },
  { iso2: 'gr', name: 'Greece', dialCode: '30' },
  { iso2: 'gt', name: 'Guatemala', dialCode: '502' },
  { iso2: 'hn', name: 'Honduras', dialCode: '504' },
  { iso2: 'hk', name: 'Hong Kong', dialCode: '852' },
  { iso2: 'hu', name: 'Hungary', dialCode: '36' },
  { iso2: 'is', name: 'Iceland', dialCode: '354' },
  { iso2: 'in', name: 'India', dialCode: '91' },
  { iso2: 'id', name: 'Indonesia', dialCode: '62' },
  { iso2: 'iq', name: 'Iraq', dialCode: '964' },
  { iso2: 'ie', name: 'Ireland', dialCode: '353' },
  { iso2: 'il', name: 'Israel', dialCode: '972' },
  { iso2: 'it', name: 'Italy', dialCode: '39' },
  { iso2: 'jm', name: 'Jamaica', dialCode: '1' },
  { iso2: 'jp', name: 'Japan', dialCode: '81' },
  { iso2: 'jo', name: 'Jordan', dialCode: '962' },
  { iso2: 'kz', name: 'Kazakhstan', dialCode: '7' },
  { iso2: 'ke', name: 'Kenya', dialCode: '254' },
  { iso2: 'kw', name: 'Kuwait', dialCode: '965' },
  { iso2: 'lv', name: 'Latvia', dialCode: '371' },
  { iso2: 'lb', name: 'Lebanon', dialCode: '961' },
  { iso2: 'lt', name: 'Lithuania', dialCode: '370' },
  { iso2: 'lu', name: 'Luxembourg', dialCode: '352' },
  { iso2: 'my', name: 'Malaysia', dialCode: '60' },
  { iso2: 'mt', name: 'Malta', dialCode: '356' },
  { iso2: 'mx', name: 'Mexico', dialCode: '52' },
  { iso2: 'md', name: 'Moldova', dialCode: '373' },
  { iso2: 'ma', name: 'Morocco', dialCode: '212' },
  { iso2: 'np', name: 'Nepal', dialCode: '977' },
  { iso2: 'nl', name: 'Netherlands', dialCode: '31' },
  { iso2: 'nz', name: 'New Zealand', dialCode: '64' },
  { iso2: 'ni', name: 'Nicaragua', dialCode: '505' },
  { iso2: 'ng', name: 'Nigeria', dialCode: '234' },
  { iso2: 'no', name: 'Norway', dialCode: '47' },
  { iso2: 'om', name: 'Oman', dialCode: '968' },
  { iso2: 'pk', name: 'Pakistan', dialCode: '92' },
  { iso2: 'pa', name: 'Panama', dialCode: '507' },
  { iso2: 'py', name: 'Paraguay', dialCode: '595' },
  { iso2: 'pe', name: 'Peru', dialCode: '51' },
  { iso2: 'ph', name: 'Philippines', dialCode: '63' },
  { iso2: 'pl', name: 'Poland', dialCode: '48' },
  { iso2: 'pt', name: 'Portugal', dialCode: '351' },
  { iso2: 'qa', name: 'Qatar', dialCode: '974' },
  { iso2: 'ro', name: 'Romania', dialCode: '40' },
  { iso2: 'ru', name: 'Russia', dialCode: '7' },
  { iso2: 'sa', name: 'Saudi Arabia', dialCode: '966' },
  { iso2: 'rs', name: 'Serbia', dialCode: '381' },
  { iso2: 'sg', name: 'Singapore', dialCode: '65' },
  { iso2: 'sk', name: 'Slovakia', dialCode: '421' },
  { iso2: 'si', name: 'Slovenia', dialCode: '386' },
  { iso2: 'za', name: 'South Africa', dialCode: '27' },
  { iso2: 'kr', name: 'South Korea', dialCode: '82' },
  { iso2: 'es', name: 'Spain', dialCode: '34' },
  { iso2: 'lk', name: 'Sri Lanka', dialCode: '94' },
  { iso2: 'se', name: 'Sweden', dialCode: '46' },
  { iso2: 'ch', name: 'Switzerland', dialCode: '41' },
  { iso2: 'tw', name: 'Taiwan', dialCode: '886' },
  { iso2: 'th', name: 'Thailand', dialCode: '66' },
  { iso2: 'tn', name: 'Tunisia', dialCode: '216' },
  { iso2: 'tr', name: 'Turkey', dialCode: '90' },
  { iso2: 'ua', name: 'Ukraine', dialCode: '380' },
  { iso2: 'uy', name: 'Uruguay', dialCode: '598' },
  { iso2: 'uz', name: 'Uzbekistan', dialCode: '998' },
  { iso2: 've', name: 'Venezuela', dialCode: '58' },
  { iso2: 'vn', name: 'Vietnam', dialCode: '84' },
];

function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const SORTED_BY_DIAL = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

export function PhoneInput({
  value,
  onChange,
  onBlur,
  error,
  defaultCountry = 'us',
  placeholder = 'Phone number',
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  defaultCountry?: string;
  placeholder?: string;
}) {
  const [country, setCountry] = useState<Country>(
    () => COUNTRIES.find((c) => c.iso2 === defaultCountry) ?? COUNTRIES[0],
  );
  const [national, setNational] = useState('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  const inited = useRef(false);
  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    if (value) {
      const match = SORTED_BY_DIAL.find((c) => value.startsWith(`+${c.dialCode}`));
      if (match) {
        setCountry(match);
        setNational(value.slice(match.dialCode.length + 1).replace(/\D/g, ''));
      } else {
        setNational(value.replace(/\D/g, ''));
      }
    }
  }, [value]);

  const emit = (c: Country, nat: string) => onChange(nat ? `+${c.dialCode}${nat}` : '');

  const handleNational = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setNational(digits);
    emit(country, digits);
  };

  const pick = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setQuery('');
    emit(c, national);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    const dq = q.replace('+', '');
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(dq) || c.iso2 === q,
    );
  }, [query]);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex h-[46px] items-center gap-2 rounded-[10px] border bg-white px-[10px] transition-colors focus-within:border-primary',
          error ? 'border-danger' : 'border-line',
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Select country code"
          className="flex flex-shrink-0 items-center gap-[5px] text-sm text-ink"
        >
          <span className="text-[18px] leading-none">{flagEmoji(country.iso2)}</span>
          <span className="text-muted">+{country.dialCode}</span>
          <ChevronDown size={14} className={cn('text-faint transition-transform', open && 'rotate-180')} />
        </button>
        <div className="h-5 w-px flex-shrink-0 bg-line" />
        <input
          type="tel"
          value={national}
          onChange={(e) => handleNational(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-[10px] border border-line bg-white shadow-[var(--shadow-pop)]">
          <div className="border-b border-hairline p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country"
              className="h-9 w-full rounded-[8px] border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary placeholder:text-faint"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[13px] text-faint">No matches</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={`${c.iso2}-${c.dialCode}`}
                  type="button"
                  onClick={() => pick(c)}
                  className={cn(
                    'flex w-full items-center gap-[10px] px-3 py-2 text-left text-sm transition-colors hover:bg-primary-soft',
                    c.iso2 === country.iso2 && 'bg-primary-soft',
                  )}
                >
                  <span className="text-[18px] leading-none">{flagEmoji(c.iso2)}</span>
                  <span className="flex-1 truncate text-ink">{c.name}</span>
                  <span className="text-muted">+{c.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
