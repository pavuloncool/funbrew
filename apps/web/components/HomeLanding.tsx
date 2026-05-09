'use client';

import { FormEvent, useState } from 'react';

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

export default function HomeLanding() {
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
      setSubmitMessage('Thanks. We will contact you soon.');
      setForm(INITIAL_FORM);
    } catch {
      setSubmitState('error');
      setSubmitMessage('Network error. Please try again in a moment.');
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] border-x-2 border-vs-border-strong px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-12">
      <section className="grid grid-cols-1 gap-6 border-2 border-vs-border-strong bg-vs-surface p-6 sm:p-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div>
          <p className="inline-flex rounded-full border-2 border-vs-border-strong bg-vs-accent-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-vs-text-primary shadow-vs-sm">
            Public Beta
          </p>
          <h1 className="mt-6 max-w-[840px] font-display text-[44px] uppercase leading-[0.95] tracking-[-0.04em] text-vs-text-primary sm:text-[62px] lg:text-[80px]">
            Better coffee data from roast to sip
          </h1>
          <p className="mt-5 max-w-[620px] text-lg leading-relaxed text-vs-text-secondary sm:text-xl">
            fun•brew connects roaster operations on web with consumer tasting flow on mobile, in
            one shared data exchange app.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="rounded-full border-2 border-vs-border-strong bg-vs-elevated px-4 py-1 text-sm font-semibold text-vs-text-primary shadow-vs-sm">
              Add coffee batch
            </span>
            <span className="rounded-full border-2 border-vs-border-strong bg-vs-elevated px-4 py-1 text-sm font-semibold text-vs-text-primary shadow-vs-sm">
              Generate QR
            </span>
            <span className="rounded-full border-2 border-vs-border-strong bg-vs-elevated px-4 py-1 text-sm font-semibold text-vs-text-primary shadow-vs-sm">
              Collect tasting logs
            </span>
            <span className="rounded-full border-2 border-vs-border-strong bg-vs-elevated px-4 py-1 text-sm font-semibold text-vs-text-primary shadow-vs-sm">
              Analyse user feedback
            </span>
          </div>
        </div>

        <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm sm:p-6">
          <h2 className="font-display text-[32px] uppercase leading-none tracking-[-0.03em] text-vs-text-primary">
            Contact
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-vs-text-secondary">
            Leave your details and we will follow up with beta access details.
          </p>

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
            />
            <input
              className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
              type="text"
              placeholder="Company (optional)"
              value={form.company}
              onChange={event => setForm(prev => ({ ...prev, company: event.target.value }))}
              maxLength={140}
              disabled={submitState === 'loading'}
            />
            <textarea
              className="min-h-[120px] rounded border border-vs-border-default bg-vs-surface px-3 py-2 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
              placeholder="What do you want to achieve with fun•brew?"
              value={form.message}
              onChange={event => setForm(prev => ({ ...prev, message: event.target.value }))}
              required
              maxLength={2000}
              disabled={submitState === 'loading'}
            />
            <button
              type="submit"
              className="vs-button-primary mt-1 w-fit text-sm font-semibold"
              disabled={submitState === 'loading'}
            >
              {submitState === 'loading' ? 'Sending…' : 'Send message'}
            </button>
          </form>

          {submitMessage ? (
            <p
              className={`mt-4 text-sm ${
                submitState === 'success' ? 'text-vs-success' : 'text-vs-danger'
              }`}
              role={submitState === 'error' ? 'alert' : 'status'}
            >
              {submitMessage}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
