export type DeclaredTelemetryStatus = 'aligned' | 'higher' | 'lower' | 'missing';

export type DeclaredTelemetryComparison = {
  declared: number | null;
  perceived: number | null;
  delta: number | null;
  status: DeclaredTelemetryStatus;
  isMissingDeclared: boolean;
  isMissingPerceived: boolean;
};

function clampDeclaredScore(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < 1 || value > 5) return null;
  return Math.round(value);
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export function compareDeclaredToPerceived(
  declared: number | null | undefined,
  perceived: number | null | undefined
): DeclaredTelemetryComparison {
  const normalizedDeclared = clampDeclaredScore(declared);
  const normalizedPerceived =
    typeof perceived === 'number' && Number.isFinite(perceived) ? round2(perceived) : null;

  if (normalizedDeclared == null || normalizedPerceived == null) {
    return {
      declared: normalizedDeclared,
      perceived: normalizedPerceived,
      delta: null,
      status: 'missing',
      isMissingDeclared: normalizedDeclared == null,
      isMissingPerceived: normalizedPerceived == null,
    };
  }

  const delta = round2(normalizedPerceived - normalizedDeclared);
  const absDelta = Math.abs(delta);
  const status: DeclaredTelemetryStatus =
    absDelta <= 0.25 ? 'aligned' : delta > 0 ? 'higher' : 'lower';

  return {
    declared: normalizedDeclared,
    perceived: normalizedPerceived,
    delta,
    status,
    isMissingDeclared: false,
    isMissingPerceived: false,
  };
}
