import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AnalyticsFilterBar from './AnalyticsFilterBar';

vi.mock('@funcup/shared', async () => {
  const actual = await vi.importActual<typeof import('@funcup/shared')>('@funcup/shared');
  return {
    ...actual,
    loadBrewMethodOptions: vi.fn(async () => [
      { id: 'espresso', name: 'Espresso' },
      { id: 'v60', name: 'V60' },
      { id: 'chemex', name: 'Chemex' },
    ]),
  };
});

describe('AnalyticsFilterBar', () => {
  it('renders compact brew method selector with disabled unobserved methods and reset action', async () => {
    const onChange = vi.fn();

    render(
      <AnalyticsFilterBar
        filters={{
          brewMethodId: 'espresso',
          minRating: 4,
          maxRating: 5,
          startDate: '2026-06-01',
          endDate: '2026-06-03',
          feedbackQuery: 'juicy',
        }}
        brewMethods={[
          { id: 'espresso', name: 'Espresso' },
          { id: 'v60', name: 'V60' },
        ]}
        onChange={onChange}
      />
    );

    expect(screen.getByRole('button', { name: 'Brew method' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Brew method' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chemex/i })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const reset = onChange.mock.calls[0][0]({
      brewMethodId: 'espresso',
      minRating: 4,
      maxRating: 5,
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      feedbackQuery: 'juicy',
    });
    expect(reset).toEqual({
      brewMethodId: null,
      minRating: null,
      maxRating: null,
      startDate: '',
      endDate: '',
      feedbackQuery: '',
    });
  });

  it('selects all methods from the brew method popover without changing filter shape', async () => {
    const onChange = vi.fn();

    render(
      <AnalyticsFilterBar
        filters={{
          brewMethodId: 'espresso',
          minRating: null,
          maxRating: null,
          startDate: '',
          endDate: '',
          feedbackQuery: '',
        }}
        brewMethods={[
          { id: 'espresso', name: 'Espresso' },
          { id: 'v60', name: 'V60' },
        ]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Brew method' }));

    const allMethods = await screen.findByRole('button', { name: /All methods/i });
    fireEvent.click(allMethods);

    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0]({
      brewMethodId: 'espresso',
      minRating: null,
      maxRating: null,
      startDate: '',
      endDate: '',
      feedbackQuery: '',
    });
    expect(next.brewMethodId).toBeNull();
  });
});
