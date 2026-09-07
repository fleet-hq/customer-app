'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FaqItem } from '@/services/companyContentServices';

interface ContentFaqProps {
  title: string;
  items: FaqItem[];
}

export function ContentFaq({ title, items }: ContentFaqProps) {
  const [open, setOpen] = useState<number>(0);
  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="mb-[18px] flex items-center gap-[12px]">
        <span className="h-[22px] w-[4px] flex-shrink-0 rounded-full bg-primary" />
        <h2 className="font-manrope text-[22px] font-bold leading-[1.25] tracking-[-0.01em] text-ink sm:text-[24px]">
          {title}
        </h2>
      </div>
      <div className="flex flex-col">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.question} className="border-b border-card-border">
              <h3 className="m-0">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-[24px] px-[4px] py-[18px] text-left"
                >
                  <span className="text-[15.5px] font-medium text-ink">{item.question}</span>
                  <span className="flex-shrink-0 text-[18px] leading-none text-primary">
                    {isOpen ? '–' : '+'}
                  </span>
                </button>
              </h3>
              <div
                className={cn(
                  'grid transition-all duration-300 ease-out',
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <p className="m-0 max-w-[760px] px-[4px] pb-[20px] text-[14.5px] leading-[1.7] text-muted">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
