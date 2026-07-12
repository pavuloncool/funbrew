import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { BatchAnalyticsDetail } from './BatchAnalyticsDetail';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@funcup/shared', () => ({
  compareSuggestedIdsToObserved: vi.fn(() => ({
    matched: [],
    suggestedOnly: [],
    observedOnly: [],
  })),
  createBrowserSupabaseClient: vi.fn(() => ({})),
  flowErrorUiCopy: vi.fn(() => ({ message: 'Something went wrong' })),
  getRoasterBatchPublicationDetail: vi.fn(async () => ({
    batch: {
      lotNumber: 'LOT-1',
      roastDate: '2026-07-12',
      suggestedBrewMethodIds: ['espresso'],
      suggestedTastingNoteIds: [],
      declaredSensoryAcidity: null,
      declaredSensorySweetness: null,
      declaredSensoryBody: null,
      declaredSensoryBitter: null,
      declaredSensoryAftertaste: null,
    },
    coffee: {
      name: 'Test Coffee',
    },
    qr: {
      hash: 'abc123',
    },
  })),
  labelForSelectedId: vi.fn(() => 'All methods'),
  loadBrewMethodOptions: vi.fn(async () => [{ id: 'espresso', name: 'Espresso' }]),
  loadTastingNoteOptions: vi.fn(async () => []),
  normalizeFlowError: vi.fn(error => error),
  sanitizeSelectedIds: vi.fn((ids: string[]) => ids),
  useRoasterAnalytics: vi.fn(() => ({
    isLoading: false,
    error: null,
    data: {
      statsUpdatedAt: '2026-07-12T10:00:00.000Z',
      brewMethodOptions: [{ id: 'espresso', name: 'Espresso' }],
    },
  })),
}));

vi.mock('@/src/hooks/useRoasterProfile', () => ({
  useRoasterProfile: vi.fn(() => ({
    loading: false,
    userId: 'user-1',
    exists: true,
    complete: true,
    error: null,
  })),
}));

vi.mock('@/src/hooks/useRoasterAnalyticsDashboard', () => ({
  useRoasterAnalyticsDashboard: vi.fn(() => ({
    filters: {
      brewMethodId: null,
      minRating: null,
      maxRating: null,
      startDate: '',
      endDate: '',
      feedbackQuery: '',
    },
    setFilters: vi.fn(),
    dashboard: {
      overview: {},
      caption: 'Current selection',
      trends: [],
      filteredSummary: {},
      telemetrySummary: {},
      telemetryScopeNote: 'Current selection',
      filteredBrewMethods: [],
      filteredFlavorNotes: [],
      filteredNotes: [],
      filteredReviews: [],
      exportDatasets: [],
    },
  })),
}));

vi.mock('@/src/components/analytics/AnalyticsOverviewMetrics', () => ({
  default: () => <div>Overview metrics</div>,
}));

vi.mock('@/src/components/analytics/AnalyticsTrendChart', () => ({
  default: () => <div>Tasting momentum panel</div>,
}));

vi.mock('@/src/components/analytics/AnalyticsSummary', () => ({
  default: () => <div>Rating snapshot panel</div>,
}));

vi.mock('@/src/components/analytics/BrewMethodMixCard', () => ({
  default: () => <div>Brew method mix panel</div>,
}));

vi.mock('@/src/components/analytics/DeclaredTelemetryComparisonCard', () => ({
  default: () => <div>Sensory core panel</div>,
}));

vi.mock('@/src/components/analytics/TelemetrySummary', () => ({
  default: () => <div>Telemetry panel</div>,
}));

vi.mock('@/src/components/analytics/TopFlavorNotes', () => ({
  default: () => <div>Flavor notes panel</div>,
}));

vi.mock('@/src/components/analytics/AnonymizedFreeTextNotes', () => ({
  default: () => <div>Free text notes panel</div>,
}));

vi.mock('@/src/components/analytics/AnonymizedReviews', () => ({
  default: () => <div>Reviews panel</div>,
}));

vi.mock('@/src/components/analytics/RoasterSuggestionComparison', () => ({
  default: () => <div>Roaster suggestions panel</div>,
}));

describe('BatchAnalyticsDetail', () => {
  it('renders analytics section tabs horizontally and switches active panels', async () => {
    render(<BatchAnalyticsDetail batchId="batch-1" />);

    const tablist = await screen.findByRole('tablist', { name: 'Analytics sections' });

    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    expect(within(tablist).getByRole('tab', { name: /Tasting momentum/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.click(within(tablist).getByRole('tab', { name: /Rating snapshot/i }));

    await waitFor(() => {
      expect(screen.getByText('Rating snapshot panel')).toBeInTheDocument();
    });
    expect(within(tablist).getByRole('tab', { name: /Rating snapshot/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('opens mobile filters in a dialog drawer', async () => {
    render(<BatchAnalyticsDetail batchId="batch-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Filters' }));

    const drawer = screen.getByRole('dialog', { name: 'Dashboard filters' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(within(drawer).getByText('Dashboard filters')).toBeInTheDocument();
    expect(within(drawer).getByLabelText('Search feedback')).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole('button', { name: 'Close filters' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Dashboard filters' })).not.toBeInTheDocument();
    });
  });
});
