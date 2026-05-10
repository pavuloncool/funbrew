'use client';

import type { AnonymizedReview } from '@funcup/shared';

import { analyticsStyles } from './analytics.styles';

type Props = {
  reviews: AnonymizedReview[];
};

export default function AnonymizedReviews({ reviews }: Props) {
  return (
    <section className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>Anonymized optional reviews</h2>
      <p className={analyticsStyles.cardCaption}>
        Source: consumer field Optional review (`reviews.body`). No consumer identity is shown here.
      </p>
      {reviews.length === 0 ? (
        <p className={analyticsStyles.emptyState}>No written reviews for this batch yet.</p>
      ) : (
        <ol className={analyticsStyles.reviewList}>
          {reviews.map((review) => (
            <li key={review.coffeeLogId} className={analyticsStyles.reviewCard}>
              <div className={analyticsStyles.reviewMeta}>
                <span>{new Date(review.createdAt).toLocaleString()}</span>
                <span>{review.rating}/5</span>
                <span>{review.brewMethodName ?? 'Unknown brew method'}</span>
              </div>
              <p className={analyticsStyles.reviewBody}>{review.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
