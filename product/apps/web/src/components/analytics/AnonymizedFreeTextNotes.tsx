'use client';

import type { AnonymizedTextEntry } from '@funcup/shared';

import { analyticsStyles } from './analytics.styles';

type Props = {
  notes: AnonymizedTextEntry[];
};

export default function AnonymizedFreeTextNotes({ notes }: Props) {
  return (
    <section className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>Anonymized free-text tasting notes</h2>
      <p className={analyticsStyles.cardCaption}>
        Source: consumer field Free-text tasting notes (`coffee_logs.free_text_notes`), without identity metadata.
      </p>
      {notes.length === 0 ? (
        <p className={analyticsStyles.emptyState}>No free-text tasting notes for this batch yet.</p>
      ) : (
        <ol className={analyticsStyles.reviewList}>
          {notes.map((note) => (
            <li key={note.coffeeLogId} className={analyticsStyles.reviewCard}>
              <div className={analyticsStyles.reviewMeta}>
                <span>{new Date(note.createdAt).toLocaleString()}</span>
                <span>{note.rating}/5</span>
                <span>{note.brewMethodName ?? 'Unknown brew method'}</span>
              </div>
              <p className={analyticsStyles.reviewBody}>{note.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
