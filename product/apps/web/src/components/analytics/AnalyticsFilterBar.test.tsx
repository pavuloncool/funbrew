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

  it('collapses the filter bar automatically once it becomes sticky on narrow screens', async () => {
    const onChange = vi.fn();
    const previousInnerWidth = window.innerWidth;
    const previousGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    let top = 100;

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 375,
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );

    render(
      <AnalyticsFilterBar
        filters={{
          brewMethodId: null,
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset filters' })).toBeInTheDocument();
      expect(
        screen.getByText('Narrow charts and tables by brew method, tasting date and rating.')
      ).toBeInTheDocument();
    });

    top = 0;
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(
        screen.queryByText('Narrow charts and tables by brew method, tasting date and rating.')
      ).not.toBeInTheDocument();
    });

    HTMLElement.prototype.getBoundingClientRect = previousGetBoundingClientRect;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: previousInnerWidth,
    });
    window.dispatchEvent(new Event('resize'));
  });
});
