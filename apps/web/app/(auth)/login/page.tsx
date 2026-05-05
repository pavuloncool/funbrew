'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { authPagesStyles } from '../auth-pages.styles';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
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
      <p className={authPagesStyles.footer}>
        No account?{' '}
        <Link href="/register" className="font-medium text-neutral-900 underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
