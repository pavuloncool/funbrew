import { describe, expect, it } from 'vitest';

import {
  labelRepurchaseIntent,
  normalizeRoasterTelemetryCoreInput,
} from './telemetryCore';

describe('roaster telemetry core contract', () => {
  it('normalizes sensory scales to 1..5 integers', () => {
    const normalized = normalizeRoasterTelemetryCoreInput({
      brewMethodId: 'bm-1',
      overallRating: 6,
      sensoryAcidity: 0,
      sensorySweetness: 2.4,
      sensoryBody: 4.6,
      sensoryBitter: 5.8,
      sensoryAftertaste: -2,
      repurchaseIntent: 'yes',
      experienceLevel: 'advanced',
    });

    expect(normalized.overallRating).toBe(5);
    expect(normalized.sensoryAcidity).toBe(1);
    expect(normalized.sensorySweetness).toBe(2);
    expect(normalized.sensoryBody).toBe(5);
    expect(normalized.sensoryBitter).toBe(5);
    expect(normalized.sensoryAftertaste).toBe(1);
  });

  it('returns user-facing repurchase labels', () => {
    expect(labelRepurchaseIntent('yes')).toBe('Would buy again');
    expect(labelRepurchaseIntent('no')).toBe('Would not buy again');
    expect(labelRepurchaseIntent('unsure')).toBe('Not sure yet');
  });
});
