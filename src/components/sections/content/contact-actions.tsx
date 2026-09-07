import type { Tenant } from '@/lib/tenant';
import { tenantWhatsapp } from '@/lib/seo';
import { Phone, Mail, Headset } from '@/components/ui/icons';

export function ContactActions({ tenant }: { tenant: Tenant }) {
  const { phone, email } = tenant.footer.contact;
  const wa = tenantWhatsapp(tenant);

  const cards = [
    wa && phone
      ? {
          key: 'wa',
          href: wa,
          external: true,
          icon: <Headset size={20} />,
          label: 'WhatsApp',
          value: phone,
          hint: 'Fastest reply — how most guests reach us',
          primary: true,
        }
      : null,
    phone
      ? {
          key: 'call',
          href: `tel:${phone}`,
          external: false,
          icon: <Phone size={20} />,
          label: 'Call',
          value: phone,
          hint: 'Same number, any time',
          primary: false,
        }
      : null,
    email
      ? {
          key: 'email',
          href: `mailto:${email}`,
          external: false,
          icon: <Mail size={20} />,
          label: 'Email',
          value: email,
          hint: 'We reply within the day',
          primary: false,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    href: string;
    external: boolean;
    icon: React.ReactNode;
    label: string;
    value: string;
    hint: string;
    primary: boolean;
  }[];

  return (
    <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-3">
      {cards.map((c) => (
        <a
          key={c.key}
          href={c.href}
          {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={
            'group flex flex-col rounded-[18px] border p-[22px] transition-all hover:-translate-y-[2px] hover:shadow-[var(--shadow-card)] ' +
            (c.primary
              ? 'border-transparent bg-secondary text-white'
              : 'border-card-border bg-white text-ink hover:border-primary-border')
          }
        >
          <span
            className={
              'flex h-[42px] w-[42px] items-center justify-center rounded-full ' +
              (c.primary ? 'bg-white/15 text-white' : 'bg-primary-soft text-primary')
            }
          >
            {c.icon}
          </span>
          <span
            className={
              'mt-[16px] text-[11.5px] font-semibold uppercase tracking-[0.08em] ' +
              (c.primary ? 'text-white/70' : 'text-primary')
            }
          >
            {c.label}
          </span>
          <span className="mt-[4px] font-manrope text-[18px] font-bold">{c.value}</span>
          <span className={'mt-[6px] text-[13px] leading-[1.5] ' + (c.primary ? 'text-white/75' : 'text-muted')}>
            {c.hint}
          </span>
        </a>
      ))}
    </div>
  );
}
