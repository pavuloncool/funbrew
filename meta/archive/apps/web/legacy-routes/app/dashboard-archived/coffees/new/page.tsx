'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

export default function NewCoffeePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!session?.access_token || !supabaseUrl || !anonKey) {
      setError('Missing auth session or Supabase env.');
      setLoading(false);
      return;
    }

    const roasterResponse = await fetch(
      `${supabaseUrl}/rest/v1/roasters?select=id&user_id=eq.${user.id}&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );
    const roasterRows = (await roasterResponse.json()) as Array<{ id: string }>;
    const roasterId = roasterRows[0]?.id;
    if (!roasterId) {
      setError('No roaster profile found for this account.');
      setLoading(false);
      return;
    }

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/coffees?select=id`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        roaster_id: roasterId,
        name,
        status: 'active',
      }),
    });
    const createdRows = (await createResponse.json()) as Array<{ id: string }>;
    const createdId = createdRows[0]?.id;

    setLoading(false);
    if (!createResponse.ok || !createdId) {
      setError('Unable to create coffee.');
      return;
    }

    router.push(`/dashboard/coffees/${createdId}`);
  }

  return (
    <main style={{ maxWidth: 760, margin: '30px auto', fontFamily: 'system-ui' }}>
      <h1>Create coffee</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          placeholder="Coffee name"
          value={name}
          onChange={event => setName(event.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create coffee'}
        </button>
      </form>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {error === 'No roaster profile found for this account.' ? (
        <p style={{ marginTop: 12 }}>
          <Link href="/dashboard/roaster/setup" style={{ fontWeight: 600 }}>
            Utwórz profil palarni
          </Link>
        </p>
      ) : null}
    </main>
  );
}
