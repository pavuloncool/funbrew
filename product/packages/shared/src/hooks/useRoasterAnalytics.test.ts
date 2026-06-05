import { describe, expect, it } from 'vitest';

import {
  deriveTelemetrySummariesFromRpc,
  extractEmbeddedReview,
  type TelemetryAggregateRow,
} from './useRoasterAnalytics';
import {
  brewMethodCountsFromLogs,
  compareSuggestedIdsToObserved,
} from '../analytics/roasterBatchAnalytics';

function row(
  partial: Partial<TelemetryAggregateRow> & {
    row_scope: 'global' | 'brew_method';
  }
): TelemetryAggregateRow {
  return {
    row_scope: partial.row_scope,
    brew_method_id: partial.brew_method_id ?? null,
    total_logs: partial.total_logs ?? 0,
    logs_with_telemetry: partial.logs_with_telemetry ?? 0,
    avg_sensory_acidity: partial.avg_sensory_acidity ?? null,
    avg_sensory_sweetness: partial.avg_sensory_sweetness ?? null,
    avg_sensory_body: partial.avg_sensory_body ?? null,
    avg_sensory_bitter: partial.avg_sensory_bitter ?? null,
    avg_sensory_aftertaste: partial.avg_sensory_aftertaste ?? null,
    repurchase_yes_count: partial.repurchase_yes_count ?? 0,
    repurchase_no_count: partial.repurchase_no_count ?? 0,
    repurchase_unsure_count: partial.repurchase_unsure_count ?? 0,
    experience_beginner_count: partial.experience_beginner_count ?? 0,
    experience_advanced_count: partial.experience_advanced_count ?? 0,
    experience_expert_count: partial.experience_expert_count ?? 0,
  };
}

describe('deriveTelemetrySummariesFromRpc', () => {
  it('maps full global telemetry aggregate', () => {
    const result = deriveTelemetrySummariesFromRpc(
      [
        row({
          row_scope: 'global',
          total_logs: 10,
          logs_with_telemetry: 10,
          avg_sensory_acidity: 3.4,
          avg_sensory_sweetness: 3.9,
          avg_sensory_body: 2.6,
          avg_sensory_bitter: 2.2,
          avg_sensory_aftertaste: 4.1,
          repurchase_yes_count: 4,
          repurchase_no_count: 3,
          repurchase_unsure_count: 3,
          experience_beginner_count: 5,
          experience_advanced_count: 3,
          experience_expert_count: 2,
        }),
      ],
      10
    );

    expect(result.global.totalLogs).toBe(10);
    expect(result.global.logsWithTelemetry).toBe(10);
    expect(result.global.coveragePercent).toBe(100);
    expect(result.global.avgSensoryAcidity).toBe(3.4);
    expect(result.global.avgSensorySweetness).toBe(3.9);
    expect(result.global.avgSensoryBody).toBe(2.6);
    expect(result.global.avgSensoryBitter).toBe(2.2);
    expect(result.global.avgSensoryAftertaste).toBe(4.1);
    expect(result.global.repurchaseIntentDistribution).toEqual({
      yes: 4,
      no: 3,
      unsure: 3,
    });
    expect(result.global.experienceLevelDistribution).toEqual({
      beginner: 5,
      advanced: 3,
      expert: 2,
    });
  });

  it('maps partial coverage telemetry aggregate', () => {
    const result = deriveTelemetrySummariesFromRpc(
      [
        row({
          row_scope: 'global',
          total_logs: 10,
          logs_with_telemetry: 4,
          avg_sensory_acidity: 2.75,
          avg_sensory_sweetness: 3.25,
          avg_sensory_body: 4.25,
          avg_sensory_bitter: 2.5,
          avg_sensory_aftertaste: 3.75,
          repurchase_yes_count: 2,
          repurchase_no_count: 1,
          repurchase_unsure_count: 1,
          experience_beginner_count: 1,
          experience_advanced_count: 2,
          experience_expert_count: 1,
        }),
      ],
      10
    );

    expect(result.global.logsWithTelemetry).toBe(4);
    expect(result.global.coveragePercent).toBe(40);
    expect(result.global.avgSensoryAcidity).toBe(2.75);
    expect(result.global.avgSensorySweetness).toBe(3.25);
    expect(result.global.avgSensoryBody).toBe(4.25);
    expect(result.global.avgSensoryBitter).toBe(2.5);
    expect(result.global.avgSensoryAftertaste).toBe(3.75);
  });

  it('returns empty summary when RPC has no rows', () => {
    const result = deriveTelemetrySummariesFromRpc([], 6);
    expect(result.global).toEqual({
      totalLogs: 6,
      logsWithTelemetry: 0,
      coveragePercent: 0,
      avgSensoryAcidity: null,
      avgSensorySweetness: null,
      avgSensoryBody: null,
      avgSensoryBitter: null,
      avgSensoryAftertaste: null,
      repurchaseIntentDistribution: {
        yes: 0,
        no: 0,
        unsure: 0,
      },
      experienceLevelDistribution: {
        beginner: 0,
        advanced: 0,
        expert: 0,
      },
    });
    expect(result.byBrewMethodId).toEqual({});
  });

  it('maps per-brew rows and supports filtered telemetry summaries', () => {
    const v60Id = '11111111-1111-1111-1111-111111111111';
    const espressoId = '22222222-2222-2222-2222-222222222222';
    const result = deriveTelemetrySummariesFromRpc(
      [
        row({
          row_scope: 'global',
          total_logs: 10,
          logs_with_telemetry: 8,
        }),
        row({
          row_scope: 'brew_method',
          brew_method_id: v60Id,
          total_logs: 6,
          logs_with_telemetry: 5,
          avg_sensory_acidity: 3.1,
          avg_sensory_sweetness: 3.4,
          avg_sensory_body: 2.9,
          avg_sensory_bitter: 2.6,
          avg_sensory_aftertaste: 3.8,
          repurchase_yes_count: 3,
          repurchase_no_count: 1,
          repurchase_unsure_count: 1,
          experience_beginner_count: 2,
          experience_advanced_count: 2,
          experience_expert_count: 1,
        }),
        row({
          row_scope: 'brew_method',
          brew_method_id: espressoId,
          total_logs: 4,
          logs_with_telemetry: 3,
          avg_sensory_acidity: 2.7,
          avg_sensory_sweetness: 3.8,
          avg_sensory_body: 4.2,
          avg_sensory_bitter: 3.1,
          avg_sensory_aftertaste: 4.4,
          repurchase_yes_count: 1,
          repurchase_no_count: 1,
          repurchase_unsure_count: 1,
          experience_beginner_count: 1,
          experience_advanced_count: 1,
          experience_expert_count: 1,
        }),
      ],
      10
    );

    expect(result.byBrewMethodId[v60Id]?.coveragePercent).toBe(83.33);
    expect(result.byBrewMethodId[espressoId]?.coveragePercent).toBe(75);
    expect(result.byBrewMethodId[v60Id]?.avgSensorySweetness).toBe(3.4);
    expect(result.byBrewMethodId[espressoId]?.avgSensoryBody).toBe(4.2);
    expect(result.byBrewMethodId[v60Id]?.avgSensoryBitter).toBe(2.6);
    expect(result.byBrewMethodId[espressoId]?.avgSensoryAftertaste).toBe(4.4);
  });
});

describe('extractEmbeddedReview', () => {
  it('handles one-to-one embedded object', () => {
    expect(
      extractEmbeddedReview({
        body: 'Seasonal espresso.',
        created_at: '2026-05-10T12:00:00.000Z',
      })
    ).toEqual({
      body: 'Seasonal espresso.',
      createdAt: '2026-05-10T12:00:00.000Z',
    });
  });

  it('handles legacy array shape and missing review', () => {
    expect(
      extractEmbeddedReview([
        {
          body: 'Legacy shape',
          created_at: '2026-05-10T12:00:00.000Z',
        },
      ])
    ).toEqual({
      body: 'Legacy shape',
      createdAt: '2026-05-10T12:00:00.000Z',
    });
    expect(extractEmbeddedReview(null)).toBeNull();
    expect(extractEmbeddedReview([])).toBeNull();
  });
});

describe('brewMethodCountsFromLogs', () => {
  it('aggregates brew methods by id and sorts by count', () => {
    expect(
      brewMethodCountsFromLogs([
        {
          id: '1',
          loggedAt: '2026-05-10T12:00:00.000Z',
          rating: 4,
          brewMethodId: 'v60',
          brewMethodName: 'V60',
          freeTextNotes: null,
          review: null,
          telemetry: null,
          flavorNotes: [],
        },
        {
          id: '2',
          loggedAt: '2026-05-10T13:00:00.000Z',
          rating: 5,
          brewMethodId: 'espresso',
          brewMethodName: 'Espresso',
          freeTextNotes: null,
          review: null,
          telemetry: null,
          flavorNotes: [],
        },
        {
          id: '3',
          loggedAt: '2026-05-10T14:00:00.000Z',
          rating: 3,
          brewMethodId: 'v60',
          brewMethodName: 'V60',
          freeTextNotes: null,
          review: null,
          telemetry: null,
          flavorNotes: [],
        },
      ])
    ).toEqual([
      { id: 'v60', name: 'V60', count: 2 },
      { id: 'espresso', name: 'Espresso', count: 1 },
    ]);
  });
});

describe('compareSuggestedIdsToObserved', () => {
  it('classifies matched, suggested-only, and observed-only selections', () => {
    expect(
      compareSuggestedIdsToObserved(
        [
          { id: 'v60', label: 'V60' },
          { id: 'espresso', label: 'Espresso' },
        ],
        [
          { id: 'espresso', label: 'Espresso' },
          { id: 'aero', label: 'Aeropress' },
        ]
      )
    ).toEqual({
      matched: [{ id: 'espresso', label: 'Espresso' }],
      suggestedOnly: [{ id: 'v60', label: 'V60' }],
      observedOnly: [{ id: 'aero', label: 'Aeropress' }],
    });
  });
});
