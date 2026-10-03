'use client';

import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

export function Dyn({ children }: { children?: string | null }) {
  const { t } = useDynamicTranslation([children ?? '']);
  return <>{t(children)}</>;
}
