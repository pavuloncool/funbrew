'use client';

import { useRouter, useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { useCreateBatch } from '@/src/hooks/useCreateBatch';

export default function NewBatchPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const createBatch = useCreateBatch();
  const [lotNumber, setLotNumber] = useState('');
  const [roastDate, setRoastDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const created = await createBatch.mutateAsync({
        coffeeId: params.id,
        lotNumber,
        roastDate,
      });
      router.push(`/dashboard/coffees/${params.id}/batches/${created.id}`);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to create batch.';
      setError(message);
      return;
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: '30px auto', fontFamily: 'system-ui' }}>
      <h1>Create batch</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          placeholder="Lot number"
          value={lotNumber}
          onChange={event => setLotNumber(event.target.value)}
          required
        />
        <input
          type="date"
          value={roastDate}
          onChange={event => setRoastDate(event.target.value)}
          required
        />
        <button type="submit" disabled={createBatch.isPending}>
          {createBatch.isPending ? 'Creating...' : 'Create batch'}
        </button>
      </form>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
    </main>
  );
}
