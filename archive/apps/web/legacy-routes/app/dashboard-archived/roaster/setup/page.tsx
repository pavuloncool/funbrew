'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

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
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace('/login?next=/dashboard/roaster/setup');
        return;
      }
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();
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
        router.replace('/tag');
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

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();
    if (!user) {
      router.replace('/login?next=/dashboard/roaster/setup');
      return;
    }

    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession();
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
    router.push('/tag');
  }

  if (checking) {
    return (
      <main style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
        <p>Ładowanie…</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'system-ui', padding: '0 16px' }}>
      <h1 style={{ fontSize: '1.35rem', marginBottom: 8 }}>Utwórz profil palarni</h1>
      <p style={{ color: '#444', marginBottom: 20, lineHeight: 1.45 }}>
        Ta nazwa będzie używana w panelu kaw i przy powiązaniu z tagiem kawy. Status weryfikacji może pozostać „oczekujący”
        do późniejszego procesu weryfikacji.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label htmlFor="roaster-name" style={{ fontWeight: 600 }}>
          Nazwa palarni
        </label>
        <input
          id="roaster-name"
          placeholder="np. Bean Lab"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          maxLength={128}
          autoComplete="organization"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Zapisywanie…' : 'Zapisz i przejdź do tagu kawy'}
        </button>
      </form>
      {error ? <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p> : null}
      <p style={{ marginTop: 24 }}>
        <Link href="/dashboard/coffees" style={{ color: '#111' }}>
          Wróć do listy kaw
        </Link>
        {' · '}
        <Link href="/tag" style={{ color: '#111' }}>
          Tag kawy
        </Link>
      </p>
    </main>
  );
}
