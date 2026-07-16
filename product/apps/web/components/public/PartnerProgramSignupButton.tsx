'use client';

import type { ReactNode } from 'react';

export const PARTNER_PROGRAM_SIGNUP_OPEN_EVENT = 'partner-program-signup:open';

export function openPartnerProgramSignupDrawer() {
  window.dispatchEvent(new Event(PARTNER_PROGRAM_SIGNUP_OPEN_EVENT));
}

export default function PartnerProgramSignupButton(props: {
  children?: ReactNode;
  className?: string;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      className={props.className ?? 'vs-button-primary inline-flex w-fit text-sm font-semibold'}
      onClick={openPartnerProgramSignupDrawer}
      aria-haspopup="dialog"
      aria-expanded={props.expanded}
    >
      {props.children ?? 'Zgłoś palarnię'}
    </button>
  );
}
