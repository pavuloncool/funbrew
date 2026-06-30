'use client';

import { FormEvent, useState } from 'react';

import { PUBLIC_BODY_COPY_CLASS } from '@/components/public/PublicInfoPage';

type LeadFormValues = {
  fullName: string;
  email: string;
  company: string;
  message: string;
};

const INITIAL_FORM: LeadFormValues = {
  fullName: '',
  email: '',
  company: '',
  message: '',
};

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

type PublicLeadFormProps = {
  formTitle?: string;
  formDescription?: string;
  submitLabel?: string;
  successMessage?: string;
  messagePlaceholder?: string;
};

export default function PublicLeadForm({
  formTitle = 'Contact',
  formDescription = 'Leave your details and we will follow up with access, onboarding, or partnership details.',
  submitLabel = 'Send message',
  successMessage = 'Thanks. We will contact you soon.',
  messagePlaceholder = 'What do you want to achieve with fun•brew? (optional)',
}: PublicLeadFormProps) {
  const [form, setForm] = useState<LeadFormValues>(INITIAL_FORM);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState('loading');
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/lead-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { message?: string } | null;
      if (!response.ok) {
        setSubmitState('error');
        setSubmitMessage(payload?.message ?? 'Could not submit your message. Please try again.');
        return;
      }

      setSubmitState('success');
      setSubmitMessage(successMessage);
      setForm(INITIAL_FORM);
    } catch {
      setSubmitState('error');
      setSubmitMessage('Network error. Please try again in a moment.');
    }
  }

  return (
    <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm sm:p-6">
      <h2 className="font-display text-[28px] uppercase leading-none tracking-[-0.03em] text-vs-text-primary sm:text-[32px]">
        {formTitle}
      </h2>
      <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>{formDescription}</p>

      <form onSubmit={handleContactSubmit} className="mt-5 grid gap-3">
        <input
          className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
          type="text"
          placeholder="Full name"
          value={form.fullName}
          onChange={event => setForm(prev => ({ ...prev, fullName: event.target.value }))}
          required
          maxLength={120}
          disabled={submitState === 'loading'}
          suppressHydrationWarning
        />
        <input
          className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
          required
          maxLength={220}
          disabled={submitState === 'loading'}
          suppressHydrationWarning
        />
        <input
          className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
          type="text"
          placeholder="Company"
          value={form.company}
          onChange={event => setForm(prev => ({ ...prev, company: event.target.value }))}
          required
          maxLength={160}
          disabled={submitState === 'loading'}
          suppressHydrationWarning
        />
        <textarea
          className="min-h-[120px] rounded border border-vs-border-default bg-vs-surface px-3 py-2 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
          placeholder={messagePlaceholder}
          value={form.message}
          onChange={event => setForm(prev => ({ ...prev, message: event.target.value }))}
          maxLength={2000}
          disabled={submitState === 'loading'}
          suppressHydrationWarning
        />
        <button
          type="submit"
          className="vs-button-primary mt-1 w-fit text-sm font-semibold"
          disabled={submitState === 'loading'}
        >
          {submitState === 'loading' ? 'Sending…' : submitLabel}
        </button>
      </form>

      {submitMessage ? (
        <p
          className={`mt-4 ${PUBLIC_BODY_COPY_CLASS} ${submitState === 'success' ? 'text-vs-success' : 'text-vs-danger'}`}
          role={submitState === 'error' ? 'alert' : 'status'}
        >
          {submitMessage}
        </p>
      ) : null}
    </div>
  );
}
