import { describe, expect, it } from 'vitest';

import { compareDeclaredToPerceived } from './declaredTelemetryComparison';

describe('compareDeclaredToPerceived', () => {
  it('marks near-equal values as aligned', () => {
    expect(compareDeclaredToPerceived(4, 4.12)).toEqual({
      declared: 4,
      perceived: 4.12,
      delta: 0.12,
      status: 'aligned',
      isMissingDeclared: false,
      isMissingPerceived: false,
    });
  });

  it('marks perceived values above declared as higher', () => {
    expect(compareDeclaredToPerceived(3, 4.1).status).toBe('higher');
    expect(compareDeclaredToPerceived(3, 4.1).delta).toBe(1.1);
  });

  it('marks perceived values below declared as lower', () => {
    expect(compareDeclaredToPerceived(4, 2.8).status).toBe('lower');
    expect(compareDeclaredToPerceived(4, 2.8).delta).toBe(-1.2);
  });

  it('surfaces missing states when declared or perceived values are absent', () => {
    expect(compareDeclaredToPerceived(null, 3.5)).toMatchObject({
      status: 'missing',
      isMissingDeclared: true,
      isMissingPerceived: false,
    });
    expect(compareDeclaredToPerceived(4, null)).toMatchObject({
      status: 'missing',
      isMissingDeclared: false,
      isMissingPerceived: true,
    });
  });
});
