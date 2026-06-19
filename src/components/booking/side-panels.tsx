import Link from 'next/link';
import { Check, Plus } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import type { TripImage } from '@/services/tripImageServices';

export interface NextStep {
  done: boolean;
  title: string;
  desc: string;
  cta: string;
  ctaHref: string;
}

export function buildNextSteps(args: {
  idVerified: boolean;
  insuranceVerified: boolean;
  showInsurance: boolean;
  idHref: string;
  insuranceHref: string;
  agreementHref: string;
}): NextStep[] {
  const steps: NextStep[] = [
    {
      done: true,
      title: 'Vehicle booked',
      desc: 'Confirmed — details are in your inbox.',
      cta: 'View agreement',
      ctaHref: args.agreementHref,
    },
    {
      done: args.idVerified,
      title: 'ID verification',
      desc: args.idVerified
        ? 'Your identity has been verified.'
        : 'Verify your identity to complete your booking.',
      cta: args.idVerified ? 'View' : 'Verify now',
      ctaHref: args.idHref,
    },
  ];
  if (args.showInsurance) {
    steps.push({
      done: args.insuranceVerified,
      title: 'Insurance verification',
      desc: args.insuranceVerified
        ? 'Your coverage has been confirmed.'
        : 'Confirm your protection or your own coverage.',
      cta: args.insuranceVerified ? 'View' : 'Verify now',
      ctaHref: args.insuranceHref,
    });
  }
  return steps;
}

export function NextSteps({ steps }: { steps: NextStep[] }) {
  return (
    <div className="rounded-2xl border border-card-border bg-white px-5 py-[18px]">
      <h3 className="mb-[6px] text-sm font-semibold text-ink">Next steps</h3>
      <div className="flex flex-col">
        {steps.map((st, i) => (
          <div
            key={st.title}
            className={cn('flex items-center gap-[14px] py-[14px]', i > 0 && 'border-t border-hairline')}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full',
                    st.done ? 'bg-primary' : 'border-2 border-accent bg-white',
                  )}
                >
                  {st.done && <Check size={11} strokeWidth={3} className="text-white" />}
                </span>
                <span className="text-[13px] font-semibold text-ink">{st.title}</span>
                <span
                  className={cn(
                    'rounded-full px-[7px] py-[2px] text-[10px] font-semibold',
                    st.done ? 'bg-green-bg-2 text-success' : 'bg-amber-bg text-amber-text-2',
                  )}
                >
                  {st.done ? 'Done' : 'Pending'}
                </span>
              </div>
              <div className="mt-1 pl-[26px] text-[11.5px] leading-[1.45] text-faint">{st.desc}</div>
            </div>
            <Link
              href={st.ctaHref}
              className={cn(
                'min-w-[112px] flex-shrink-0 rounded-[7px] px-4 py-2 text-center text-xs font-semibold whitespace-nowrap',
                st.done ? 'border border-line text-ink' : 'bg-primary text-white',
              )}
            >
              {st.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PhotoGroup {
  title: string;
  hint?: string;
  photos: TripImage[];
}

export function TripPhotos({ groups, note }: { groups: PhotoGroup[]; note: string }) {
  return (
    <div className="rounded-2xl border border-card-border bg-white px-5 py-[18px]">
      <h3 className="mb-1 text-sm font-semibold text-ink">Trip photos</h3>
      <p className="mb-4 text-[11.5px] leading-[1.45] text-faint">{note}</p>
      <div className="flex flex-col gap-4">
        {groups.map((g) => {
          const count = g.photos.length;
          const meta = count > 0 ? `${count} photo${count === 1 ? '' : 's'}` : (g.hint ?? 'No photos yet');
          return (
            <div key={g.title}>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold text-ink">
                  {g.title} <span className="font-medium text-placeholder">· {meta}</span>
                </div>
                {count > 0 && <span className="cursor-pointer text-[11px] font-semibold text-primary">View all</span>}
              </div>
              <div className="grid grid-cols-4 gap-[7px]">
                {g.photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative aspect-square overflow-hidden rounded-[9px] bg-cover bg-center"
                    style={{ backgroundImage: `url('${p.imageUrl}')` }}
                  >
                    <span className="absolute top-1 right-1 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-primary">
                      <Check size={9} strokeWidth={3.4} className="text-white" />
                    </span>
                  </div>
                ))}
                <div className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[9px] border-[1.5px] border-dashed border-dash text-primary">
                  <Plus size={16} />
                  <span className="text-[9px] font-semibold text-faint">Add</span>
                </div>
                {count === 0 &&
                  [0, 1, 2].map((i) => (
                    <div key={i} className="aspect-square rounded-[9px] border border-hairline bg-subtle" />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
