'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { authPagesStyles } from '../auth-pages.styles';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: {
        data: {
          app_role: 'roaster',
        },
      },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    router.push('/pending');
  }

  return (
    <main className={authPagesStyles.main420}>
      <h1 className={authPagesStyles.title}>Create account</h1>
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
          placeholder="Password (min 8 chars)"
          minLength={8}
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
        />
        <button type="submit" className={authPagesStyles.submitBtn} disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>
      {error ? <p className={authPagesStyles.error}>{error}</p> : null}
      <p className={authPagesStyles.footer}>
        Already have account?{' '}
        <Link href="/login" className="font-medium text-vs-text-primary underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
