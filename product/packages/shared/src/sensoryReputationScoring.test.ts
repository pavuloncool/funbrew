import { describe, expect, it } from 'vitest';

import { calculateFairSensoryReputationScore } from './sensoryReputationScoring';

const dictionary = [
  { name: 'berry', label: 'Berry' },
  { name: 'chocolate', label: 'Chocolate' },
  { name: 'almond', label: 'Almond' },
  { name: 'stone-fruit', label: 'Stone Fruit' },
];

describe('fair sensory reputation scoring', () => {
  it('lets repeated taste preferences advance through complete structured logs', () => {
    const logs = Array.from({ length: 8 }, (_, index) => ({
      batchId: `batch-${index}`,
      rating: 4,
      brewMethodId: 'v60',
      tastingNotes: [
        { name: 'chocolate' },
        { name: 'almond' },
        { name: 'berry' },
      ],
      hasCompleteSensoryCore: true,
    }));

    const score = calculateFairSensoryReputationScore(logs, dictionary);

    expect(score.structuredConsistency).toBe(3);
    expect(score.dictionaryLearning).toBe(5);
    expect(score.total).toBeGreaterThanOrEqual(30);
  });

  it('scores a new tasting note only once', () => {
    const score = calculateFairSensoryReputationScore(
      [
        { batchId: 'a', rating: 4, brewMethodId: 'v60', tastingNotes: [{ name: 'chocolate' }] },
        { batchId: 'b', rating: 5, brewMethodId: 'v60', tastingNotes: [{ name: 'chocolate' }] },
      ],
      dictionary
    );

    expect(score.dictionaryLearning).toBe(3);
  });

  it('recognizes dictionary notes in free text with a small one-time learning bonus', () => {
    const score = calculateFairSensoryReputationScore(
      [
        {
          batchId: 'a',
          rating: 4,
          freeTextNotes: 'Clean cup with chocolate finish.',
          review: 'I keep coming back to this chocolate and almond profile.',
        },
      ],
      dictionary
    );

    expect(score.dictionaryLearning).toBe(4);
    expect(score.textFields).toBe(1);
  });
});
