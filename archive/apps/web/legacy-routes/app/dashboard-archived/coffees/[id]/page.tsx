'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

type CoffeeData = { id: string; name: string; status: string; created_at: string };

export default function CoffeeDetailsPage() {
  const params = useParams<{ id: string }>();
  const [coffee, setCoffee] = useState<CoffeeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error: fetchError } = await supabaseBrowser
        .from('coffees')
        .select('id,name,status,created_at')
        .eq('id', params.id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setCoffee(data);
    }
    void load();
  }, [params.id]);

  return (
    <main style={{ maxWidth: 760, margin: '30px auto', fontFamily: 'system-ui' }}>
      <h1>Coffee details</h1>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {coffee ? (
        <>
          <p>
            <strong>Name:</strong> {coffee.name}
          </p>
          <p>
            <strong>Status:</strong> {coffee.status}
          </p>
          <p>
            <strong>Created:</strong> {new Date(coffee.created_at).toLocaleString()}
          </p>
          <p>
            <Link href={`/dashboard/coffees/${coffee.id}/batches/new`}>+ Create batch</Link>
          </p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
