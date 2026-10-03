'use client';

import { Download, Check } from '@/components/ui/icons';
import { ValidationModal } from '@/components/ui/validation-modal';
import { RentalAgreementPreview } from '@/components/booking/rental-agreement-preview';
import { Dyn } from '@/components/i18n/Dyn';
import { useRentalAgreementIndex } from './use-rental-agreement-index';
import styles from '@/styles/template-2.module.css';

/** Template-2 sibling of /rental-agreement. Shares every bit of state
 *  and business logic with template 1 via useRentalAgreementIndex() —
 *  only presentation differs. */
export default function RentalAgreementIndexT2() {
  const {
    bookingId,
    agreement,
    isLoading,
    agree,
    setAgree,
    signature,
    setSignature,
    isSaving,
    error,
    validationModal,
    setValidationModal,
    handleAccept,
    isSigned,
  } = useRentalAgreementIndex();

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          <Dyn>Loading agreement…</Dyn>
        </p>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className={styles.container}>
        <div className={styles.articleHead}>
          <h1>
            <Dyn>Agreement not found</Dyn>
          </h1>
          <p className={styles.articleIntro}>
            <Dyn>
              {bookingId
                ? 'No agreement found for this booking. Please contact support.'
                : 'The agreement you are looking for does not exist.'}
            </Dyn>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.articleHead}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div>
              <h1>{agreement.template.title}</h1>
              <p className={styles.articleIntro}>{agreement.template.description}</p>
            </div>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`}>
              <Download size={15} /> <Dyn>Download PDF</Dyn>
            </button>
          </div>
        </div>

        <div className={styles.formCard}>
          <RentalAgreementPreview data={agreement} onSignatureChange={setSignature} />
        </div>

        {error ? <p className={`${styles.noticeBox} ${styles.noticeBoxDanger}`}>{error}</p> : null}

        {isSigned ? (
          <div className={styles.formNote}>
            <Check size={16} strokeWidth={3} />
            <span>
              <Dyn>This agreement has been signed.</Dyn>
            </span>
          </div>
        ) : (
          <div className={styles.toolbar}>
            <label onClick={() => setAgree((a) => !a)} className={styles.formTrustItem} style={{ cursor: 'pointer' }}>
              {agree ? <Check size={14} /> : null}
              <span>
                <Dyn>{`I have read and agree to the ${agreement.template.title} set out above, including the insurance, fuel, mileage and cancellation provisions.`}</Dyn>
              </span>
            </label>
            <button
              type="button"
              disabled={!signature || !agree || isSaving}
              onClick={handleAccept}
              className={`${styles.btn} ${styles.btnBrass}`}
            >
              {isSaving ? <Dyn>Saving…</Dyn> : <Dyn>Sign & Accept</Dyn>}
            </button>
          </div>
        )}
      </div>

      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal({ isOpen: false, title: '', message: '' })}
        title={validationModal.title}
        message={validationModal.message}
      />
    </>
  );
}
