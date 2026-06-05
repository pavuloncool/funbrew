'use client';

import { analyticsStyles } from './analytics.styles';

type ComparisonItem = {
  id: string;
  label: string;
  meta?: string | null;
};

type Props = {
  title: string;
  caption: string;
  suggested: ComparisonItem[];
  observed: ComparisonItem[];
  matched: ComparisonItem[];
  suggestedOnly: ComparisonItem[];
  observedOnly: ComparisonItem[];
  emptySuggestedLabel: string;
  emptyObservedLabel: string;
};

function ItemPills(props: {
  items: ComparisonItem[];
  emptyLabel: string;
  tone: 'neutral' | 'matched' | 'missing' | 'unexpected';
}) {
  const toneClass =
    props.tone === 'matched'
      ? analyticsStyles.pillMatch
      : props.tone === 'missing'
        ? analyticsStyles.pillMissing
        : props.tone === 'unexpected'
          ? analyticsStyles.pillUnexpected
          : analyticsStyles.pillNeutral;

  if (props.items.length === 0) {
    return <p className={analyticsStyles.emptyState}>{props.emptyLabel}</p>;
  }

  return (
    <div className={analyticsStyles.pillList}>
      {props.items.map((item) => (
        <span key={item.id} className={`${analyticsStyles.pillBase} ${toneClass}`}>
          {item.label}
          {item.meta ? <span className="ml-2 text-xs opacity-80">{item.meta}</span> : null}
        </span>
      ))}
    </div>
  );
}

export default function RoasterSuggestionComparison(props: Props) {
  return (
    <section className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>{props.title}</h2>
      <p className={analyticsStyles.cardCaption}>{props.caption}</p>

      <div className={analyticsStyles.compareColumns}>
        <div className={analyticsStyles.compareBlock}>
          <h3 className={analyticsStyles.sectionTitle}>Roaster suggestions</h3>
          <ItemPills
            items={props.suggested}
            emptyLabel={props.emptySuggestedLabel}
            tone="neutral"
          />
        </div>
        <div className={analyticsStyles.compareBlock}>
          <h3 className={analyticsStyles.sectionTitle}>Consumer reality</h3>
          <ItemPills
            items={props.observed}
            emptyLabel={props.emptyObservedLabel}
            tone="neutral"
          />
        </div>
      </div>

      <div className={analyticsStyles.compareColumns}>
        <div className={analyticsStyles.compareBlock}>
          <h3 className={analyticsStyles.sectionTitle}>Matched suggestions</h3>
          <ItemPills items={props.matched} emptyLabel="No overlap yet." tone="matched" />
        </div>
        <div className={analyticsStyles.compareBlock}>
          <h3 className={analyticsStyles.sectionTitle}>Suggested only</h3>
          <ItemPills items={props.suggestedOnly} emptyLabel="Everything suggested has been observed." tone="missing" />
        </div>
      </div>

      <div className={analyticsStyles.compareBlockStacked}>
        <h3 className={analyticsStyles.sectionTitle}>Observed only</h3>
        <ItemPills
          items={props.observedOnly}
          emptyLabel="Consumers have not added anything outside the suggestion set."
          tone="unexpected"
        />
      </div>
    </section>
  );
}
