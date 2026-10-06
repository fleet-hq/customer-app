'use client';

import DOMPurify from 'dompurify';
import { Download, Check } from '@/components/ui/icons';
import { RentalAgreementPreview } from '@/components/booking/rental-agreement-preview';
import { Dyn } from '@/components/i18n/Dyn';
import { useTermsAgreement, type Section } from './use-terms-agreement';
import styles from '@/styles/template-2.module.css';

function TermsSectionT2({ sec }: { sec: Section }) {
  return (
    <div className={styles.articleSection}>
      <h2>{sec.heading}</h2>
      {sec.html !== undefined ? (
        <div className={styles.articleParas} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sec.html) }} />
      ) : (
        <div className={styles.articleParas}>
          {sec.paras?.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Template-2 sibling of /terms. Shares every bit of state and the
 *  booking-signature business logic with template 1 via
 *  useTermsAgreement() — only presentation differs. */
export default function TermsClientT2() {
  const {
    isBound,
    tokenReady,
    bookingLoading,
    bookingError,
    agreement,
    agree,
    setAgree,
    signature,
    setSignature,
    saving,
    error,
    accept,
    isSigned,
    title,
    intro,
    sections,
    templateLoading,
  } = useTermsAgreement();

  if (isBound) {
    if (!tokenReady || bookingLoading) {
      return (
        <div className={styles.container}>
          <p className={styles.eyebrow}>
            <Dyn>Loading agreement…</Dyn>
          </p>
        </div>
      );
    }

    if (bookingError || !agreement) {
      return (
        <div className={styles.container}>
          <div className={styles.articleHead}>
            <h1>
              <Dyn>Agreement not found</Dyn>
            </h1>
            <p className={styles.articleIntro}>
              <Dyn>We couldn&apos;t load this booking. Please re-open the agreement from the link we emailed you.</Dyn>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <div className={styles.articleHead}>
          <h1>{agreement.template.title}</h1>
          <p className={styles.articleIntro}>{agreement.template.description}</p>
        </div>

        <div className={styles.formCard}>
          <RentalAgreementPreview data={agreement} onSignatureChange={setSignature} />
        </div>

        {error ? (
          <p className={styles.noticeBox + ' ' + styles.noticeBoxDanger}>{error}</p>
        ) : null}

        {isSigned ? (
          <div className={styles.formNote}>
            <Check size={16} strokeWidth={3} />
            <span>
              <Dyn>This agreement has been signed.</Dyn>
            </span>
          </div>
        ) : (
          <div className={`no-print ${styles.toolbar}`}>
            <label onClick={() => setAgree((a) => !a)} className={styles.formTrustItem} style={{ cursor: 'pointer' }}>
              {agree ? <Check size={14} /> : null}
              <span>
                <Dyn>{`I have read and agree to the ${agreement.template.title} set out above, including the insurance, fuel, mileage and cancellation provisions.`}</Dyn>
              </span>
            </label>
            <button
              type="button"
              disabled={!signature || !agree || saving}
              onClick={accept}
              className={`${styles.btn} ${styles.btnBrass}`}
            >
              {saving ? <Dyn>Saving…</Dyn> : <Dyn>Sign & Accept</Dyn>}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.articleHead}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <h1>{title}</h1>
            <p className={styles.articleIntro}>{intro}</p>
          </div>
          <button type="button" onClick={() => window.print()} className={`no-print ${styles.btn} ${styles.btnGhost}`}>
            <Download size={15} /> <Dyn>Download PDF</Dyn>
          </button>
        </div>
      </div>

      {templateLoading ? (
        <div className={styles.articleBody}>
          <div className={styles.skeletonCard} style={{ aspectRatio: 'auto', height: '4rem' }} />
        </div>
      ) : (
        <div className={styles.articleBody}>
          {sections.map((sec) => (
            <TermsSectionT2 key={sec.heading} sec={sec} />
          ))}
        </div>
      )}
    </div>
  );
}
