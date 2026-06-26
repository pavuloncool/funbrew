import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TelemetrySummary from './TelemetrySummary';

describe('TelemetrySummary', () => {
  it('renders only repurchase intent and experience level content for the other data card', () => {
    render(
      <TelemetrySummary
        title="Other data"
        caption="Repurchase intent and experience level reported by consumers for this batch."
        summary={{
          totalLogs: 10,
          logsWithTelemetry: 10,
          coveragePercent: 100,
          avgSensoryAcidity: 3,
          avgSensorySweetness: 3,
          avgSensoryBody: 3,
          avgSensoryBitter: 3,
          avgSensoryAftertaste: 3,
          repurchaseIntentDistribution: {
            yes: 4,
            no: 4,
            unsure: 2,
          },
          experienceLevelDistribution: {
            beginner: 2,
            advanced: 6,
            expert: 2,
          },
        }}
      />
    );

    expect(screen.getByText('Other data')).toBeInTheDocument();
    expect(screen.getByText('Repurchase intent')).toBeInTheDocument();
    expect(screen.getByText('Experience level')).toBeInTheDocument();
    expect(screen.queryByText('Rating coverage')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg acidity')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg sweet')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg body')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg bitter')).not.toBeInTheDocument();
    expect(screen.queryByText('Avg finish')).not.toBeInTheDocument();
  });

  it('uses row bar colors that match the stacked distribution colors', () => {
    const { container } = render(
      <TelemetrySummary
        title="Other data"
        caption="Repurchase intent and experience level reported by consumers for this batch."
        summary={{
          totalLogs: 10,
          logsWithTelemetry: 10,
          coveragePercent: 100,
          avgSensoryAcidity: 3,
          avgSensorySweetness: 3,
          avgSensoryBody: 3,
          avgSensoryBitter: 3,
          avgSensoryAftertaste: 3,
          repurchaseIntentDistribution: {
            yes: 4,
            no: 4,
            unsure: 2,
          },
          experienceLevelDistribution: {
            beginner: 2,
            advanced: 6,
            expert: 2,
          },
        }}
      />
    );

    const wouldBuyAgainRow = screen.getByText('Would buy again').closest('li');
    const wouldNotBuyAgainRow = screen.getByText('Would not buy again').closest('li');
    const notSureRow = screen.getByText('Not sure').closest('li');
    const beginnerRow = screen.getByText('Beginner').closest('li');
    const advancedRow = screen.getByText('Advanced').closest('li');
    const expertRow = screen.getByText('Expert').closest('li');

    expect(wouldBuyAgainRow?.querySelector('.bg-vs-accent-secondary')).toBeInTheDocument();
    expect(wouldNotBuyAgainRow?.querySelector('.bg-vs-hero-primary')).toBeInTheDocument();
    expect(notSureRow?.querySelector('.bg-vs-warning')).toBeInTheDocument();
    expect(beginnerRow?.querySelector('.bg-vs-accent-secondary')).toBeInTheDocument();
    expect(advancedRow?.querySelector('.bg-vs-hero-primary')).toBeInTheDocument();
    expect(expertRow?.querySelector('.bg-vs-warning')).toBeInTheDocument();

    const stackedSegments = container.querySelectorAll(
      '.bg-vs-accent-secondary, .bg-vs-hero-primary, .bg-vs-warning'
    );
    expect(stackedSegments.length).toBeGreaterThanOrEqual(12);
  });
});
