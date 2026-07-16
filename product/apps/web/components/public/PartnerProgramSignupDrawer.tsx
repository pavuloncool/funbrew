'use client';

import { useEffect, useState } from 'react';

import PublicLeadForm from '@/components/public/PublicLeadForm';
import PartnerProgramSignupButton, {
  PARTNER_PROGRAM_SIGNUP_OPEN_EVENT,
} from '@/components/public/PartnerProgramSignupButton';

export default function PartnerProgramSignupDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpenSignupDrawer() {
      setOpen(true);
    }

    window.addEventListener(PARTNER_PROGRAM_SIGNUP_OPEN_EVENT, handleOpenSignupDrawer);

    return () => {
      window.removeEventListener(PARTNER_PROGRAM_SIGNUP_OPEN_EVENT, handleOpenSignupDrawer);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <PartnerProgramSignupButton
        className="fixed right-0 top-1/2 z-40 flex h-12 w-36 origin-bottom-right -rotate-90 items-center justify-center rounded-vs-sm border-2 border-vs-border-strong bg-vs-accent-secondary px-4 text-sm font-semibold leading-none text-vs-text-primary shadow-vs-md transition hover:bg-vs-accent-secondaryPressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vs-border-strong sm:h-14 sm:w-44 sm:text-base"
        expanded={open}
      >
        <span className="whitespace-nowrap">Zgłoś palarnię</span>
      </PartnerProgramSignupButton>

      {open ? (
        <div
          className="fixed inset-0 z-[70] bg-black/20"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-program-drawer-title"
            className="ml-auto flex h-full w-[min(34rem,calc(100vw-1rem))] flex-col overflow-y-auto border-l-2 border-vs-border-strong bg-vs-elevated p-4 shadow-vs-md sm:p-5"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                id="partner-program-drawer-title"
                className="font-display text-[28px] uppercase leading-none tracking-[-0.03em] text-vs-text-primary sm:text-[32px]"
              >
                Zgłoszenie
              </h2>
              <button
                type="button"
                className="rounded-full border-2 border-vs-border-strong bg-vs-elevated px-3 py-1 text-sm font-semibold text-vs-text-primary shadow-vs-sm"
                onClick={() => setOpen(false)}
              >
                Zamknij
              </button>
            </div>

            <PublicLeadForm
              variant="partnerProgram"
              formTitle="Zgłoś palarnię do programu"
              leadSource="partner_program_home"
              emailSubject="Web Inquiry from Landing"
              submitLabel="Zgłoś palarnię do programu"
              successMessage={
                <>
                  Dziękujemy za zgłoszenie. Odezwiemy się w sprawie udziału w programie.
                  <br />
                  Ekipa <b>fun•brew</b>.
                </>
              }
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
