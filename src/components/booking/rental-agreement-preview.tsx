'use client';

import { useTenant } from '@/lib/tenant-context';
import { pickTemplateView } from '@/lib/template-view';
import { AgreementTemplate1 } from './agreement-template-1';
import { AgreementTemplate2 } from './agreement-template-2';
import type { RentalAgreementPreviewProps } from './agreement-primitives';

export function RentalAgreementPreview({ data, onSignatureChange }: RentalAgreementPreviewProps) {
  const tenant = useTenant();
  const template = data?.agreementTemplate ?? tenant.agreementTemplate;
  const View = pickTemplateView(template, {
    template_1: AgreementTemplate1,
    template_2: AgreementTemplate2,
  });
  const withOwner =
    data && !data.owner?.signatureImage && tenant.ownerSignature.image
      ? {
          ...data,
          owner: {
            signatureImage: tenant.ownerSignature.image,
            name: tenant.ownerSignature.name,
            signedAt: tenant.ownerSignature.signedAt,
          },
        }
      : data;
  return <View data={withOwner} onSignatureChange={onSignatureChange} />;
}
