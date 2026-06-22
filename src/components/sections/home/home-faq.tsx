'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FaqItem {
  question: string;
  answer: string;
}

interface HomeFaqProps {
  eyebrow: string;
  title: string;
  items: FaqItem[];
}

export function HomeFaq({ eyebrow, title, items }: HomeFaqProps) {
  const [open, setOpen] = useState<number>(0);

  // Suppress the section until an admin has added at least one FAQ.
  if (!items || items.length === 0) return null;
  return (
    <section id="faqs" className="bg-subtle py-[60px]">
      <div id="faq" className="mx-auto max-w-[860px] px-6">
        <div className="mb-[44px] text-center">
          <div className="mb-[11px] text-[12px] font-semibold tracking-[0.05em] text-primary uppercase">{eyebrow}</div>
          <h2 className="m-0 text-[23px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        </div>
        <div className="flex flex-col">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.question} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-[24px] px-[4px] py-[19px] text-left"
                >
                  <span className="text-[14.5px] font-medium text-ink">{item.question}</span>
                  <span className="flex-shrink-0 text-[17px] leading-none text-primary">{isOpen ? '–' : '+'}</span>
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="m-0 max-w-[760px] px-[4px] pb-[20px] text-[11px] leading-[1.7] text-faint">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
