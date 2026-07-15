'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useId, useRef, useState } from 'react';

import { PUBLIC_BODY_COPY_CLASS } from '@/components/public/PublicInfoPage';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { cn } from '@/src/lib/utils';

type LeadFormValues = {
  fullName: string;
  email: string;
  company: string;
  message: string;
};

type LeadSubmitPayload = LeadFormValues & {
  source: string;
  subject?: string;
  turnstileToken?: string;
};

type PartnerProgramFormValues = {
  roasteryName: string;
  contactPerson: string;
  email: string;
  websiteOrInstagram: string;
  salesChannels: string[];
  insightQuestion: string;
};

const INITIAL_FORM: LeadFormValues = {
  fullName: '',
  email: '',
  company: '',
  message: '',
};

const INITIAL_PARTNER_FORM: PartnerProgramFormValues = {
  roasteryName: '',
  contactPerson: '',
  email: '',
  websiteOrInstagram: '',
  salesChannels: [],
  insightQuestion: '',
};

const SALES_CHANNEL_OPTIONS = ['online', 'stacjonarnie', 'przez partnerów', 'inne / mieszany model'] as const;

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

type PublicLeadFormProps = {
  variant?: 'contact' | 'partnerProgram';
  formTitle?: string;
  formDescription?: string;
  leadSource?: string;
  emailSubject?: string;
  submitLabel?: string;
  successMessage?: ReactNode;
};

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset?: (widgetId?: string) => void;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function PublicLeadForm({
  variant = 'contact',
  formTitle = 'Contact',
  formDescription,
  leadSource = 'web_public_entry',
  emailSubject,
  submitLabel = 'Send message',
  successMessage = 'Thanks. We will contact you soon.',
}: PublicLeadFormProps) {
  const [form, setForm] = useState<LeadFormValues>(INITIAL_FORM);
  const [partnerForm, setPartnerForm] = useState<PartnerProgramFormValues>(INITIAL_PARTNER_FORM);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState<ReactNode>(null);
  const [salesChannelOpen, setSalesChannelOpen] = useState(false);
  const [intentConfirmed, setIntentConfirmed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const salesChannelLabelId = useId();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileEnabled = variant === 'partnerProgram' && Boolean(turnstileSiteKey);

  const salesChannelLabel =
    partnerForm.salesChannels.length > 0 ? partnerForm.salesChannels.join(', ') : 'Wybierz kanały sprzedaży';

  function toggleSalesChannel(channel: string) {
    setPartnerForm(prev => ({
      ...prev,
      salesChannels: prev.salesChannels.includes(channel)
        ? prev.salesChannels.filter(item => item !== channel)
        : [...prev.salesChannels, channel],
    }));
  }

  function buildPartnerProgramMessage(values: PartnerProgramFormValues): string {
    const salesChannels = values.salesChannels.length > 0 ? values.salesChannels.join(', ') : 'nie podano';

    return [
      'Zgłoszenie do Programu Partnerów Branżowych',
      '',
      `Nazwa palarni: ${values.roasteryName}`,
      `Osoba kontaktowa: ${values.contactPerson}`,
      `Email: ${values.email}`,
      `Strona / Instagram: ${values.websiteOrInstagram}`,
      `Kanały sprzedaży: ${salesChannels}`,
      '',
      'Czego palarnia chce się dowiedzieć o odbiorze kawy przez konsumentów:',
      values.insightQuestion,
    ].join('\n');
  }

  useEffect(() => {
    if (!turnstileEnabled) {
      return;
    }

    if (window.turnstile) {
      setTurnstileReady(true);
      return;
    }

    const scriptSrc = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    function markReady() {
      setTurnstileReady(true);
    }

    if (existingScript) {
      existingScript.addEventListener('load', markReady);
      return () => existingScript.removeEventListener('load', markReady);
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', markReady);
    document.head.appendChild(script);

    return () => script.removeEventListener('load', markReady);
  }, [turnstileEnabled]);

  useEffect(() => {
    if (
      !turnstileEnabled ||
      !turnstileReady ||
      !turnstileSiteKey ||
      !turnstileContainerRef.current ||
      !window.turnstile ||
      turnstileWidgetIdRef.current
    ) {
      return;
    }

    turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      theme: 'light',
      callback: token => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
      'error-callback': () => setTurnstileToken(''),
    });

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
      }
      turnstileWidgetIdRef.current = null;
    };
  }, [turnstileEnabled, turnstileReady, turnstileSiteKey]);

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);

    if (variant === 'partnerProgram' && !intentConfirmed) {
      setSubmitState('error');
      setSubmitMessage('Potwierdź chęć zgłoszenia palarni do programu.');
      return;
    }

    if (turnstileEnabled && !turnstileToken) {
      setSubmitState('error');
      setSubmitMessage('Potwierdź, że zgłoszenie nie jest spamem.');
      return;
    }

    setSubmitState('loading');

    const submitPayload: LeadSubmitPayload =
      variant === 'partnerProgram'
        ? {
            fullName: partnerForm.contactPerson,
            email: partnerForm.email,
            company: partnerForm.roasteryName,
            message: buildPartnerProgramMessage(partnerForm),
            source: leadSource,
          }
        : { ...form, source: leadSource };

    if (emailSubject) {
      submitPayload.subject = emailSubject;
    }
    if (turnstileToken) {
      submitPayload.turnstileToken = turnstileToken;
    }

    try {
      const response = await fetch('/api/lead-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload),
      });

      const responsePayload = (await response.json()) as { message?: string } | null;
      if (!response.ok) {
        setSubmitState('error');
        setSubmitMessage(responsePayload?.message ?? 'Could not submit your message. Please try again.');
        return;
      }

      setSubmitState('success');
      setSubmitMessage(successMessage);
      if (variant === 'partnerProgram') {
        setPartnerForm(INITIAL_PARTNER_FORM);
        setIntentConfirmed(false);
        setTurnstileToken('');
        if (turnstileWidgetIdRef.current && window.turnstile?.reset) {
          window.turnstile.reset(turnstileWidgetIdRef.current);
        }
      } else {
        setForm(INITIAL_FORM);
      }
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
      {formDescription ? <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>{formDescription}</p> : null}

      <form onSubmit={handleContactSubmit} className="mt-5 grid gap-3">
        {variant === 'partnerProgram' ? (
          <>
            <label className="grid gap-1 text-sm font-semibold text-vs-text-primary">
              Nazwa palarni
              <input
                className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm font-normal text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
                type="text"
                value={partnerForm.roasteryName}
                onChange={event => setPartnerForm(prev => ({ ...prev, roasteryName: event.target.value }))}
                required
                maxLength={160}
                disabled={submitState === 'loading'}
                suppressHydrationWarning
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-vs-text-primary">
              Osoba kontaktowa
              <input
                className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm font-normal text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
                type="text"
                value={partnerForm.contactPerson}
                onChange={event => setPartnerForm(prev => ({ ...prev, contactPerson: event.target.value }))}
                required
                maxLength={120}
                disabled={submitState === 'loading'}
                suppressHydrationWarning
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-vs-text-primary">
              Email
              <input
                className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm font-normal text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
                type="email"
                value={partnerForm.email}
                onChange={event => setPartnerForm(prev => ({ ...prev, email: event.target.value }))}
                required
                maxLength={220}
                disabled={submitState === 'loading'}
                suppressHydrationWarning
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-vs-text-primary">
              Strona / Instagram
              <input
                className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm font-normal text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
                type="text"
                value={partnerForm.websiteOrInstagram}
                onChange={event => setPartnerForm(prev => ({ ...prev, websiteOrInstagram: event.target.value }))}
                required
                maxLength={220}
                disabled={submitState === 'loading'}
                suppressHydrationWarning
              />
            </label>
            <div className="grid gap-1 text-sm font-semibold text-vs-text-primary">
              <p id={salesChannelLabelId}>Aktywne kanały sprzedaży</p>
              <Popover open={salesChannelOpen} onOpenChange={setSalesChannelOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-labelledby={salesChannelLabelId}
                    className={cn(
                      'min-h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-left text-sm font-normal text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60',
                      partnerForm.salesChannels.length === 0 && 'text-vs-text-muted'
                    )}
                    disabled={submitState === 'loading'}
                  >
                    {salesChannelLabel}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  collisionPadding={16}
                  className="z-[80] w-[min(32rem,calc(100vw-4rem))] border-2 border-vs-border-strong bg-vs-elevated p-3"
                >
                  <div className="space-y-2">
                    {SALES_CHANNEL_OPTIONS.map(channel => {
                      const selected = partnerForm.salesChannels.includes(channel);

                      return (
                        <button
                          key={channel}
                          type="button"
                          aria-pressed={selected}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-vs-sm border border-vs-border-subtle/40 bg-vs-surface px-3 py-3 text-left text-sm transition-colors',
                            selected && 'border-vs-hero-primary bg-vs-hero-primary/10'
                          )}
                          onClick={() => toggleSalesChannel(channel)}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-semibold',
                              selected
                                ? 'border-vs-hero-primary bg-vs-hero-primary text-vs-text-inverse'
                                : 'border-vs-border-strong bg-vs-elevated text-transparent'
                            )}
                          >
                            ✓
                          </span>
                          <span className="font-medium text-vs-text-primary">{channel}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="mt-3 w-fit rounded-vs-sm border border-vs-border-strong bg-vs-hero-primary px-3 py-1.5 text-sm font-semibold text-vs-text-primary shadow-vs-sm transition hover:bg-vs-hero-primary/90"
                      onClick={() => setSalesChannelOpen(false)}
                    >
                      Gotowe
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <label className="grid gap-1 text-sm font-semibold text-vs-text-primary">
              Czego najbardziej chcielibyście dowiedzieć się o tym, jak konsumenci odbierają Waszą kawę?
              <textarea
                className="min-h-[150px] rounded border border-vs-border-default bg-vs-surface px-3 py-2 text-sm font-normal text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
                value={partnerForm.insightQuestion}
                onChange={event => setPartnerForm(prev => ({ ...prev, insightQuestion: event.target.value }))}
                required
                maxLength={1800}
                disabled={submitState === 'loading'}
                suppressHydrationWarning
              />
            </label>
            <label className="flex items-start gap-3 rounded border border-vs-border-default bg-vs-surface p-3 text-sm font-semibold text-vs-text-primary">
              <input
                className="mt-0.5 h-4 w-4 accent-vs-hero-primary"
                type="checkbox"
                checked={intentConfirmed}
                onChange={event => setIntentConfirmed(event.target.checked)}
                required
                disabled={submitState === 'loading'}
              />
              <span>Potwierdzam, że chcę zgłosić palarnię do Programu Partnerów Branżowych.</span>
            </label>
            {turnstileEnabled ? (
              <div
                ref={turnstileContainerRef}
                className="min-h-[65px]"
                aria-label="Weryfikacja antyspamowa Cloudflare Turnstile"
              />
            ) : null}
          </>
        ) : (
          <>
            <input
              className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
              type="text"
              placeholder="Full name*"
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
              placeholder="Email*"
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
              placeholder="Company*"
              value={form.company}
              onChange={event => setForm(prev => ({ ...prev, company: event.target.value }))}
              required
              maxLength={160}
              disabled={submitState === 'loading'}
              suppressHydrationWarning
            />
            <textarea
              className="min-h-[120px] rounded border border-vs-border-default bg-vs-surface px-3 py-2 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
              placeholder="Your message*"
              value={form.message}
              onChange={event => setForm(prev => ({ ...prev, message: event.target.value }))}
              required
              maxLength={2000}
              disabled={submitState === 'loading'}
              suppressHydrationWarning
            />
          </>
        )}
        <button
          type="submit"
          className="vs-button-primary mt-1 w-fit text-sm font-semibold"
          disabled={submitState === 'loading'}
        >
          {submitState === 'loading' ? (variant === 'partnerProgram' ? 'Wysyłanie…' : 'Sending…') : submitLabel}
        </button>
        {variant === 'partnerProgram' ? (
          <p className="text-sm leading-relaxed text-vs-text-muted">
            Dane z formularza wykorzystamy wyłącznie do kontaktu w sprawie Programu Partnerów
            Branżowych. Szczegóły:{' '}
            <Link href="/privacy" className="font-semibold text-vs-text-primary underline underline-offset-4">
              Polityka prywatności
            </Link>
            .
          </p>
        ) : null}
      </form>

      {submitMessage ? (
        <p
          className={`mt-4 whitespace-pre-line ${PUBLIC_BODY_COPY_CLASS} ${submitState === 'success' ? 'text-vs-success' : 'text-vs-danger'}`}
          role={submitState === 'error' ? 'alert' : 'status'}
        >
          {submitMessage}
        </p>
      ) : null}
    </div>
  );
}
