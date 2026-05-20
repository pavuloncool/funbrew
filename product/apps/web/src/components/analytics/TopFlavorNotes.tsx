'use client';

import type { FlavorNoteRank } from '@funcup/shared';

import { analyticsStyles } from './analytics.styles';

type Props = {
  title: string;
  caption?: string;
  notes: FlavorNoteRank[];
};

export default function TopFlavorNotes({ title, caption, notes }: Props) {
  return (
    <section className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>{title}</h2>
      {caption ? <p className={analyticsStyles.cardCaption}>{caption}</p> : null}
      {notes.length === 0 ? (
        <p className={analyticsStyles.emptyState}>No flavor tags in this selection.</p>
      ) : (
        <ol className={analyticsStyles.flavorList}>
          {notes.map((n, i) => (
            <li key={n.id} className={analyticsStyles.flavorRow}>
              <span className={analyticsStyles.flavorName}>
                <span className={analyticsStyles.flavorRank}>{i + 1}.</span>
                {n.label}
                <span className={analyticsStyles.flavorCategory}>({n.category})</span>
              </span>
              <span className={analyticsStyles.flavorCount}>{n.count}×</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
