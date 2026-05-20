'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { getBrowserUserSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { hubCrudStyles } from '../../hub-crud.styles';

type LegacyCoffeeDetailsRedirectPageClientProps = {
  coffeeId: string;
  batchId: string | null;
};

export default function LegacyCoffeeDetailsRedirectPageClient({
  coffeeId,
  batchId,
}: LegacyCoffeeDetailsRedirectPageClientProps) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (batchId) {
        router.replace(`/roaster-hub/batches/${batchId}`);
        return;
      }

      const user = await getBrowserUserSafely();
      if (!user) {
        router.replace('/roaster-hub/batches');
        return;
      }

      const roasterResult = await supabaseBrowser
        .from('roasters')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      const roasterId = (roasterResult.data as { id: string } | null)?.id ?? null;
      if (!roasterId || cancelled) {
        router.replace('/roaster-hub/batches');
        return;
      }

      const coffeeResult = await supabaseBrowser
        .from('coffees')
        .select('id')
        .eq('id', coffeeId)
        .eq('roaster_id', roasterId)
        .maybeSingle();
      if (!coffeeResult.data || cancelled) {
        router.replace('/roaster-hub/batches');
        return;
      }

      const batchResult = await supabaseBrowser
        .from('roast_batches')
        .select('id')
        .eq('coffee_id', coffeeId)
        .order('roast_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const resolvedBatchId = (batchResult.data as { id: string } | null)?.id ?? null;
      router.replace(
        resolvedBatchId ? `/roaster-hub/batches/${resolvedBatchId}` : '/roaster-hub/batches'
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, coffeeId, router]);

  return (
    <main className={hubCrudStyles.main760}>
      <p className={hubCrudStyles.muted}>Opening the current batch manager…</p>
    </main>
  );
}
