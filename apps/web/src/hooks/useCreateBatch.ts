'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getBrowserSessionSafely } from '@/src/lib/supabase/browserAuth';

type CreateBatchInput = {
  coffeeId: string;
  lotNumber: string;
  roastDate: string;
  brewingNotes: string;
  roasterStory: string;
};

type CreateBatchResult = {
  id: string;
};

async function createBatch(input: CreateBatchInput): Promise<CreateBatchResult> {
  const session = await getBrowserSessionSafely();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!session?.access_token || !supabaseUrl || !anonKey) {
    throw new Error('Missing auth session or Supabase env.');
  }

  const createResponse = await fetch(`${supabaseUrl}/rest/v1/roast_batches?select=id`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      coffee_id: input.coffeeId,
      lot_number: input.lotNumber,
      roast_date: input.roastDate,
      brewing_notes: input.brewingNotes || null,
      roaster_story: input.roasterStory || null,
      status: 'active',
    }),
  });

  const rows = (await createResponse.json()) as Array<{ id: string }>;
  const batchId = rows[0]?.id;
  if (!createResponse.ok || !batchId) {
    throw new Error('Unable to create batch.');
  }

  return { id: batchId };
}

export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roaster-coffees'] });
    },
  });
}
