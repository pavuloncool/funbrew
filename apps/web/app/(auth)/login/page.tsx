'use client';

import { resolveAccountRole } from '@funcup/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { authPagesStyles } from '../auth-pages.styles';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reason = searchParams.get('reason');
  const roleGateMessage =
    reason === 'consumer_mobile_only'
      ? 'This consumer account is available in the mobile app only.'
      : null;

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
        if (role !== 'roaster') {
          await supabaseBrowser.auth.signOut({ scope: 'local' });
          setError('This consumer account is available in the mobile app only.');
          return;
        }
      } catch (roleError) {
        setError(roleError instanceof Error ? roleError.message : 'Could not verify account role.');
        return;
      }
    }

    router.push('/roaster-hub');
  }

  return (
    <main className={authPagesStyles.main420}>
      <h1 className={authPagesStyles.title}>Log in</h1>
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
      {!error && roleGateMessage ? <p className={authPagesStyles.error}>{roleGateMessage}</p> : null}
      <p className={authPagesStyles.footer}>
        No account?{' '}
        <Link href="/register" className="font-medium text-vs-text-primary underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
