import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DeclaredTelemetryComparisonCard from './DeclaredTelemetryComparisonCard';

describe('DeclaredTelemetryComparisonCard', () => {
  it('renders Sensory Core overview metrics above the declared vs perceived comparison', () => {
    render(
      <DeclaredTelemetryComparisonCard
        title="Declared vs Perceived Sensory Core"
        caption="Comparison caption"
        declaredSensoryAcidity={4}
        declaredSensorySweetness={3}
        declaredSensoryBody={3}
        declaredSensoryBitter={2}
        declaredSensoryAftertaste={4}
        perceivedSummary={{
          totalLogs: 2,
          logsWithTelemetry: 2,
          coveragePercent: 100,
          avgSensoryAcidity: 4.25,
          avgSensorySweetness: 2.5,
          avgSensoryBody: 3,
          avgSensoryBitter: 2.75,
          avgSensoryAftertaste: 4.5,
          repurchaseIntentDistribution: { yes: 1, no: 0, unsure: 1 },
          experienceLevelDistribution: { beginner: 0, advanced: 2, expert: 0 },
        }}
      />
    );

    expect(screen.getByText('Declared vs Perceived Sensory Core')).toBeInTheDocument();
    expect(screen.getByText('Sensory Core overview')).toBeInTheDocument();
    expect(screen.getByText('Sensory Core coverage')).toBeInTheDocument();
    expect(screen.getByText('Sensory Radar')).toBeInTheDocument();
    expect(screen.getByText('Avg acidity')).toBeInTheDocument();
    expect(screen.getByText('Avg sweet')).toBeInTheDocument();
    expect(screen.getByText('Avg body')).toBeInTheDocument();
    expect(screen.getByText('Avg bitter')).toBeInTheDocument();
    expect(screen.getByText('Avg finish')).toBeInTheDocument();
    expect(screen.getByText('/ 2')).toBeInTheDocument();
    expect(screen.getAllByText('4.25').length).toBeGreaterThan(0);
    expect(screen.queryByText('Delta table')).not.toBeInTheDocument();
  });

  it('renders empty state when nothing is declared and no Sensory Core exists', () => {
    render(
      <DeclaredTelemetryComparisonCard
        title="Declared vs Perceived Sensory Core"
        caption="Comparison caption"
        declaredSensoryAcidity={null}
        declaredSensorySweetness={null}
        declaredSensoryBody={null}
        declaredSensoryBitter={null}
        declaredSensoryAftertaste={null}
        perceivedSummary={{
          totalLogs: 0,
          logsWithTelemetry: 0,
          coveragePercent: 0,
          avgSensoryAcidity: null,
          avgSensorySweetness: null,
          avgSensoryBody: null,
          avgSensoryBitter: null,
          avgSensoryAftertaste: null,
          repurchaseIntentDistribution: { yes: 0, no: 0, unsure: 0 },
          experienceLevelDistribution: { beginner: 0, advanced: 0, expert: 0 },
        }}
      />
    );

    expect(screen.getByText('Sensory Core overview')).toBeInTheDocument();
    expect(screen.getByText('Sensory Core coverage')).toBeInTheDocument();
    expect(
      screen.getByText('No declared Sensory Core targets and no consumer Sensory Core yet.')
    ).toBeInTheDocument();
  });
});
