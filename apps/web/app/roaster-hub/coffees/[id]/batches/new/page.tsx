'use client';

import { useRouter, useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { useCreateBatch } from '@/src/hooks/useCreateBatch';
import {
  emptyCanonicalBatchFormValues,
  trimCanonicalBatchFormValues,
} from '@/src/lib/canonicalPublisher';

import { hubCrudStyles } from '../../../../hub-crud.styles';

export default function NewBatchPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const createBatch = useCreateBatch();
  const [form, setForm] = useState(emptyCanonicalBatchFormValues());
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const next = trimCanonicalBatchFormValues(form);

    try {
      const created = await createBatch.mutateAsync({
        coffeeId: params.id,
        lotNumber: next.lotNumber,
        roastDate: next.roastDate,
        brewingNotes: next.brewingNotes,
        roasterStory: next.roasterStory,
      });
      router.push(`/roaster-hub/coffees/${params.id}/batches/${created.id}`);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to create batch.';
      setError(message);
      return;
    }
  }

  return (
    <main className={hubCrudStyles.main760}>
      <h1 className={hubCrudStyles.pageHeading}>Create canonical batch</h1>
      <p className={`${hubCrudStyles.muted} mb-5 max-w-[640px]`}>
        Add the batch fields that the consumer Coffee Page and tasting flow read directly.
      </p>
      <form onSubmit={handleSubmit} className={hubCrudStyles.formGrid}>
        <label className={hubCrudStyles.formGrid}>
          <span className={hubCrudStyles.label}>Lot number</span>
          <input
            className={hubCrudStyles.input}
            placeholder="LOT-2026-05"
            value={form.lotNumber}
            onChange={event =>
              setForm((prev) => ({ ...prev, lotNumber: event.target.value }))
            }
            required
          />
        </label>
        <label className={hubCrudStyles.formGrid}>
          <span className={hubCrudStyles.label}>Roast date</span>
          <input
            className={hubCrudStyles.input}
            type="date"
            value={form.roastDate}
            onChange={event =>
              setForm((prev) => ({ ...prev, roastDate: event.target.value }))
            }
            required
          />
        </label>
        <label className={hubCrudStyles.formGrid}>
          <span className={hubCrudStyles.label}>Brewing notes</span>
          <textarea
            className={`${hubCrudStyles.input} min-h-28 resize-y`}
            value={form.brewingNotes}
            onChange={event =>
              setForm((prev) => ({ ...prev, brewingNotes: event.target.value }))
            }
            placeholder="Recipe hints, water, ratio, grind…"
          />
        </label>
        <label className={hubCrudStyles.formGrid}>
          <span className={hubCrudStyles.label}>Roaster story</span>
          <textarea
            className={`${hubCrudStyles.input} min-h-28 resize-y`}
            value={form.roasterStory}
            onChange={event =>
              setForm((prev) => ({ ...prev, roasterStory: event.target.value }))
            }
            placeholder="What makes this batch worth tasting?"
          />
        </label>
        <button type="submit" className={hubCrudStyles.submitBtn} disabled={createBatch.isPending}>
          {createBatch.isPending ? 'Creating...' : 'Create batch'}
        </button>
      </form>
      {error ? <p className={hubCrudStyles.error}>{error}</p> : null}
    </main>
  );
}
