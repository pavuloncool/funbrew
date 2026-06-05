'use client';

import type { FlavorNoteRank } from '@funcup/shared';

import { analyticsStyles } from './analytics.styles';

type Props = {
  title: string;
  caption?: string;
  notes: FlavorNoteRank[];
};

export default function TopFlavorNotes({ title, caption, notes }: Props) {
  const maxCount = Math.max(1, ...notes.map((note) => note.count));

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
              <div className="min-w-0 flex-1">
                <span className={analyticsStyles.flavorName}>
                  <span className={analyticsStyles.flavorRank}>{i + 1}.</span>
                  {n.label}
                  <span className={analyticsStyles.flavorCategory}>({n.category})</span>
                </span>
                <div className="mt-2 h-2 overflow-hidden rounded-full border border-vs-border-strong bg-vs-elevated">
                  <div
                    className="h-full rounded-full bg-vs-hero-primary"
                    style={{ width: `${Math.round((n.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
              <span className={analyticsStyles.flavorCount}>{n.count}×</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
