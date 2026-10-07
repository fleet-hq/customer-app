import type { ComponentType, SVGProps } from 'react';
import {
  Calendar,
  Car,
  Check,
  Clock,
  Headset,
  IdCard,
  Info,
  Key,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plane,
  ShieldCheck,
  Sparkles,
  Star,
  Swap,
  Upload,
  User,
} from '@/components/ui/icons';

type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

/** The icons an operator can pick by name, shared by hero features and
 *  content blocks so there is one list to extend rather than a private
 *  map per component. Names are stable — they are stored in tenant
 *  content — so rename with care. */
export const CONTENT_ICONS: Record<string, IconCmp> = {
  calendar: Calendar,
  car: Car,
  check: Check,
  clock: Clock,
  headset: Headset,
  'id-card': IdCard,
  info: Info,
  key: Key,
  lock: Lock,
  mail: Mail,
  'map-pin': MapPin,
  phone: Phone,
  plane: Plane,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  swap: Swap,
  upload: Upload,
  user: User,
};

export const CONTENT_ICON_NAMES = Object.keys(CONTENT_ICONS);

/** Resolve a stored icon name, falling back when it is absent or no
 *  longer in the registry. */
export function iconByName(name: string | undefined, fallback: IconCmp): IconCmp {
  if (!name) return fallback;
  return CONTENT_ICONS[name.trim().toLowerCase()] ?? fallback;
}
