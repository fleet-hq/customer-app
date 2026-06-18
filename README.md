# customer-central

A single, central, multi-tenant Next.js customer-facing rental site. One deployment
serves every company; a request is mapped to a tenant by its host (custom domain or
subdomain) — the host→company model from `../customer-sclaing-arch.md`. This is the
frontend the FHQ customer apps are intended to consolidate onto.

Visual design is a faithful build of `../new-customer-design/` (the "Alpha Auto"
verify-then-pay booking flow). **Frontend only — no backend wiring yet.**

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · TypeScript.

## Run

```bash
npm install
npm run dev      # http://localhost:3100
npm run build && npm start
```

## Multi-tenancy

- `src/lib/tenant.ts` — `Tenant` shape + a static registry + `getTenantByHost(host)`.
  Today it is static so the UI can be built/themed without a backend; swap
  `getTenantByHost` for a domains-table / API lookup later — the shape is unchanged.
- `src/lib/get-tenant.ts` — server-side resolution from the request `host` header.
- `src/app/layout.tsx` — resolves the tenant, injects per-tenant brand colors as CSS
  variables on `<html>`. Every Tailwind brand utility (`bg-primary`, `text-primary-dark`,
  `text-accent`, …) references those variables, so a tenant override re-themes the whole
  app with no rebuild.
- `src/lib/tenant-context.tsx` — `useTenant()` for client components.

Try it: `curl -H "Host: harbordrive.com" http://localhost:3100/` serves the second
sample tenant with a blue theme. Local subdomains like `alpha-auto.localhost:3100`
also resolve.

## Routes

| Route | Screen |
|---|---|
| `/` | Home (hero + search + fleet preview + about/FAQ/contact) |
| `/fleet` | Vehicle listing |
| `/checkout/[carId]` | Vehicle checkout — driver + payment, agreement, Reserve Now |
| `/booking/confirm` | **Hold + verify-then-pay** (centerpiece): live countdown, ID + insurance gating, pay unlocks only when both verified |
| `/booking/verify/id` | ID verification |
| `/booking/verify/insurance` | Insurance verification |
| `/booking/[id]` | Confirmed booking |
| `/booking/[id]/payment-pending` | Payment-pending variant |
| `/booking/[id]/modify` | Modify trip (built to design theme) |
| `/booking/[id]/swap` | Change vehicle (built to design theme) |
| `/booking/[id]/cancel` | Cancel booking (built to design theme) |
| `/terms` | Rental agreement + signature |
| `/manage` | My bookings |
| `/sign-in`, `/register` | Account screens (built to design theme) |

Pages not present in the design package (`modify`, `swap`, `cancel`, `manage`,
`sign-in`, `register`) were designed in the same theme.

## Booking flow state

`src/lib/booking-state.ts` holds the hold deadline + verification flags in
`localStorage` (as the prototype specifies). In production these become server-side
booking/session state — the hook surface is kept small so that swap is one file.

## Central content (`src/lib/site-content.ts`)

All marketing + legal copy (hero, fleet preview, features, about, FAQs, CTA, and the
Terms sections) lives in a per-tenant `SiteContent` registry keyed by tenant slug —
the same pattern as the FHQ apps' `site-content.ts`. Pages read it via
`getSiteContent(tenant.slug)`; nothing is hardcoded in the JSX. `{company}` tokens are
interpolated with `withCompany(text, tenant.name)`. Booking/transactional data lives in
`src/lib/mock-data.ts`. Adding a tenant = one `Tenant` entry + one `SiteContent` entry.

## Colors & components — all central

Every color is a token in `src/app/globals.css` (`@theme`); there are **no raw hex
values** in components or pages. Brand colors (`primary`, `primary-dark`,
`primary-hover`, `accent`) are tenant-overridable CSS variables, so `bg-primary`,
`text-primary-dark`, SVG `var(--color-*)` strokes, and even the signature pen color
(`tenant.theme.primaryDark`) all re-theme per tenant with no rebuild. Shared primitives
live in `src/components/ui`, chrome in `src/components/layout`, search in
`src/components/search`, and booking widgets in `src/components/booking` — every screen
composes these, none reimplement them.
