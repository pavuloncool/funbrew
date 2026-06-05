'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  getBrowserSessionSafely,
  getBrowserUserSafely,
} from '@/src/lib/supabase/browserAuth';

import { hubCrudStyles } from '../hub-crud.styles';

const LOGIN_NEXT = '/login?next=/roaster-hub/setup';

export default function RoasterSetupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const user = await getBrowserUserSafely();
      if (cancelled) return;
      if (!user) {
        router.replace(LOGIN_NEXT);
        return;
      }
      const session = await getBrowserSessionSafely();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!session?.access_token || !supabaseUrl || !anonKey) {
        if (!cancelled) setChecking(false);
        return;
      }
      const res = await fetch(
        `${supabaseUrl}/rest/v1/roasters?select=id&user_id=eq.${user.id}&limit=1`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const rows = (await res.json()) as Array<{ id: string }>;
      if (cancelled) return;
      if (rows[0]?.id) {
        router.replace('/roaster-hub/batches/new');
        return;
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const user = await getBrowserUserSafely();
    if (!user) {
      router.replace(LOGIN_NEXT);
      return;
    }

    const session = await getBrowserSessionSafely();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!session?.access_token || !supabaseUrl || !anonKey) {
      setError('Brak sesji lub konfiguracji Supabase.');
      setLoading(false);
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Podaj nazwę palarni.');
      setLoading(false);
      return;
    }

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/roasters?select=id`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        user_id: user.id,
        name: trimmed,
        company_name: trimmed,
      }),
    });

    const body = (await createResponse.json()) as unknown;
    setLoading(false);

    if (!createResponse.ok) {
      const msg =
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        typeof (body as { message: unknown }).message === 'string'
          ? (body as { message: string }).message
          : `Nie udało się utworzyć profilu palarni (${createResponse.status}).`;
      setError(msg);
      return;
    }

    const rows = body as Array<{ id: string }>;
    if (!Array.isArray(rows) || !rows[0]?.id) {
      setError('Nie udało się utworzyć profilu palarni.');
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['roaster-coffees'] });
    router.push('/roaster-hub/batches/new');
  }

  if (checking) {
    return (
      <main className={hubCrudStyles.main480}>
        <p className={hubCrudStyles.muted}>Ładowanie…</p>
      </main>
    );
  }

  return (
    <main className={hubCrudStyles.main480}>
      <h1 className={hubCrudStyles.titleSetup}>Create Roaster Profile</h1>
      <p className={hubCrudStyles.lead}>
        Ta nazwa będzie używana w panelu kaw i przy powiązaniu z tagiem kawy. Status weryfikacji może pozostać „oczekujący”
        do późniejszego procesu weryfikacji.
      </p>
      <form onSubmit={handleSubmit} className={hubCrudStyles.formGrid}>
        <label htmlFor="roaster-name" className={hubCrudStyles.label}>
          Nazwa palarni
        </label>
        <input
          id="roaster-name"
          className={hubCrudStyles.input}
          placeholder="np. Bean Lab"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          maxLength={128}
          autoComplete="organization"
        />
        <button type="submit" className={hubCrudStyles.submitBtn} disabled={loading}>
          {loading ? 'Zapisywanie…' : 'Zapisz i przejdź do tworzenia batcha'}
        </button>
      </form>
      {error ? <p className={hubCrudStyles.error}>{error}</p> : null}
      <p className={hubCrudStyles.footerLinks}>
        <Link href="/roaster-hub/batches" className={hubCrudStyles.link}>
          Wróć do batchy
        </Link>
      </p>
    </main>
  );
}
