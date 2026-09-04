import type { Metadata } from 'next';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { InquiryPageBody } from '@/components/sections/inquiry/inquiry-page';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getCurrentTenant();
    return { title: `Contact — ${tenant.name}` };
  } catch (err) {
    if (err instanceof TenantNotFoundError) return { title: 'Contact' };
    throw err;
  }
}

export default function ContactPage() {
  return <InquiryPageBody />;
}
