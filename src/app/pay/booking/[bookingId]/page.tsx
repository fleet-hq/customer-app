import { redirect } from 'next/navigation';
import { paths } from '@/lib/paths';

export default async function PayBookingRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bookingId } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  }
  const suffix = query.toString();
  redirect(`${paths.booking(bookingId)}${suffix ? `?${suffix}` : ''}`);
}
