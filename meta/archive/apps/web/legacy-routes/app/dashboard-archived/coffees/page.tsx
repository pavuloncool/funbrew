'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { useRoasterCoffees } from '@/src/hooks/useRoasterCoffees';

export default function CoffeesPage() {
  const { data: coffees = [], error, isLoading } = useRoasterCoffees();

  useEffect(() => {
    async function ensureAuth() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (!user) {
        window.location.href = '/login';
      }
    }
    void ensureAuth();
  }, []);

  const errorMessage =
    error instanceof Error
      ? error.message === 'AUTH_REQUIRED'
        ? null
        : error.message
      : null;

  const needsRoasterSetup =
    typeof errorMessage === 'string' &&
    errorMessage.includes('No roaster profile linked to this account.');

  return (
    <main style={{ maxWidth: 760, margin: '30px auto', fontFamily: 'system-ui' }}>
      <h1>Roaster coffees</h1>
      <p>
        <Link href="/dashboard/coffees/new">+ New coffee</Link>
      </p>
      {isLoading ? <p>Loading...</p> : null}
      {errorMessage ? <p style={{ color: 'crimson' }}>{errorMessage}</p> : null}
      {needsRoasterSetup ? (
        <p style={{ marginTop: 12 }}>
          <Link href="/dashboard/roaster/setup" style={{ fontWeight: 600 }}>
            Utwórz profil palarni
          </Link>
        </p>
      ) : null}
      {!isLoading && coffees.length === 0 ? <p>No coffees yet.</p> : null}
      <ul>
        {coffees.map(coffee => (
          <li key={coffee.id}>
            <Link href={`/dashboard/coffees/${coffee.id}`}>
              {coffee.name} ({coffee.status})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
