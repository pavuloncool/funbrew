'use client';

import {
  canAccessSurface,
  getDeniedAccessReason,
  getWebLoginReasonMessage,
  resolveAccountRole,
  resolveWebAuthenticatedPath,
} from '@funcup/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { authPagesStyles } from '../auth-pages.styles';

type LoginPageClientProps = {
  nextParam: string | null;
  reason: string | null;
};

export default function LoginPageClient({ nextParam, reason }: LoginPageClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reasonMessage = getWebLoginReasonMessage(reason);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    if (data.user?.id) {
      try {
        const role = await resolveAccountRole(
          supabaseBrowser,
          data.user.id,
          data.user.user_metadata
        );
        if (!canAccessSurface(role, 'web_roaster')) {
          await supabaseBrowser.auth.signOut({ scope: 'local' });
          setError(getWebLoginReasonMessage(getDeniedAccessReason('web_roaster')));
          return;
        }

        router.push(resolveWebAuthenticatedPath(nextParam, data.user.user_metadata));
        return;
      } catch (roleError) {
        setError(roleError instanceof Error ? roleError.message : 'Could not verify account role.');
        return;
      }
    }

    router.push(resolveWebAuthenticatedPath(nextParam, data.user?.user_metadata));
  }

  return (
    <main className="mx-auto w-full max-w-[980px] px-4 py-10 font-sans text-vs-text-primary sm:px-6 sm:py-12">
      <section className="grid gap-8 border-2 border-vs-border-strong bg-vs-surface p-6 shadow-vs-sm lg:grid-cols-[1.05fr_0.95fr] lg:items-start sm:p-8">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border-2 border-vs-border-strong bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-vs-text-primary shadow-vs-sm">
            Account access
          </p>
          <div className="space-y-4">
            <h1 className="max-w-[14ch] font-display text-[40px] uppercase leading-[0.95] tracking-[-0.04em] text-vs-text-primary sm:text-[52px] lg:text-[64px]">
              Log in
            </h1>
            <p className="max-w-[620px] text-base leading-relaxed text-vs-text-secondary sm:text-lg">
              Sign in to continue to your roaster workspace, batch publishing tools, and
              analytics. If you need access, contact fun•brew and we will route you to the
              right account flow.
            </p>
          </div>

          <p className={authPagesStyles.footer}>
            No account?{' '}
            <Link href="/contact" className="font-medium text-vs-text-primary underline">
              Contact fun•brew
            </Link>
          </p>
        </div>

        <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm sm:p-6">
          <h2 className="font-display text-[28px] uppercase leading-none tracking-[-0.03em] text-vs-text-primary sm:text-[32px]">
            Sign in
          </h2>
          <p className={`mt-3 text-base leading-relaxed text-vs-text-secondary sm:text-lg`}>
            Use your email and password to open the roaster dashboard.
          </p>
          {reason === 'roaster_auth_required' && reasonMessage ? (
            <p className={authPagesStyles.notice}>{reasonMessage}</p>
          ) : null}
          <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
            <input
              className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
              type="email"
              placeholder="Email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
              autoComplete="email"
              suppressHydrationWarning
            />
            <input
              className="h-11 rounded border border-vs-border-default bg-vs-surface px-3 text-sm text-vs-text-primary outline-none focus-visible:ring-2 focus-visible:ring-vs-hero-primary/60"
              type="password"
              placeholder="Password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              suppressHydrationWarning
            />
            <button type="submit" className={authPagesStyles.submitBtn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          {error ? <p className={authPagesStyles.error}>{error}</p> : null}
          {!error && reason === 'consumer_mobile_only' && reasonMessage ? (
            <p className={authPagesStyles.error}>{reasonMessage}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
