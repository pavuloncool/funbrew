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
    <main className={authPagesStyles.main420}>
      <h1 className={authPagesStyles.title}>Log in</h1>
      {reason === 'roaster_auth_required' && reasonMessage ? (
        <p className={authPagesStyles.notice}>{reasonMessage}</p>
      ) : null}
      <form onSubmit={handleSubmit} className={authPagesStyles.form}>
        <input
          className={authPagesStyles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
        />
        <input
          className={authPagesStyles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
        />
        <button type="submit" className={authPagesStyles.submitBtn} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      {error ? <p className={authPagesStyles.error}>{error}</p> : null}
      {!error && reason === 'consumer_mobile_only' && reasonMessage ? (
        <p className={authPagesStyles.error}>{reasonMessage}</p>
      ) : null}
      <p className={authPagesStyles.footer}>
        No account?{' '}
        <Link href="/register" className="font-medium text-vs-text-primary underline">
          Contact fun•brew
        </Link>
      </p>
    </main>
  );
}
