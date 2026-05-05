'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { hubCrudStyles } from '../../hub-crud.styles';

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
    <main className={hubCrudStyles.main760}>
      <p className="mb-4">
        <Link href="/coffee-bank" className={hubCrudStyles.navBack}>
          ← Coffee Bank
        </Link>
      </p>
      <h1 className={hubCrudStyles.pageHeading}>Coffee details</h1>
      {error ? <p className={hubCrudStyles.error}>{error}</p> : null}
      {coffee ? (
        <>
          <p className={hubCrudStyles.bodyText}>
            <strong className={hubCrudStyles.bodyStrong}>Name:</strong> {coffee.name}
          </p>
          <p className={hubCrudStyles.bodyText}>
            <strong className={hubCrudStyles.bodyStrong}>Status:</strong> {coffee.status}
          </p>
          <p className={hubCrudStyles.bodyText}>
            <strong className={hubCrudStyles.bodyStrong}>Created:</strong> {new Date(coffee.created_at).toLocaleString()}
          </p>
          <p className={hubCrudStyles.inlineGapTop}>
            <Link href={`/roaster-hub/coffees/${coffee.id}/batches/new`} className={hubCrudStyles.actionLink}>
              + Create batch
            </Link>
          </p>
        </>
      ) : (
        <p className={hubCrudStyles.muted}>Loading...</p>
      )}
    </main>
  );
}
