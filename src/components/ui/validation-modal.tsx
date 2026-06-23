'use client';

import { useId } from 'react';
import { Dialog } from './dialog';
import { Info } from './icons';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function ValidationModal({ isOpen, onClose, title, message }: ValidationModalProps) {
  const titleId = useId();
  const descId = useId();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={titleId} describedBy={descId}>
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Info size={20} />
          </div>
          <h3 id={titleId} className="text-lg font-semibold text-ink">
            {title}
          </h3>
        </div>
      </div>
      <div className="px-6 pb-4">
        <p id={descId} className="text-sm leading-relaxed text-muted">
          {message}
        </p>
      </div>
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-full items-center justify-center rounded-[9px] bg-primary px-[22px] text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Got it
        </button>
      </div>
    </Dialog>
  );
}
