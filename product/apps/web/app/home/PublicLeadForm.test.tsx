import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PublicLeadForm from '@/components/public/PublicLeadForm';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('PublicLeadForm', () => {
  it('submits partner program leads through the contact lead endpoint', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ message: 'ok' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <PublicLeadForm
        variant="partnerProgram"
        leadSource="partner_program_home"
        submitLabel="Zgłoś palarnię do programu"
      />
    );

    fireEvent.change(screen.getByLabelText('Nazwa palarni'), {
      target: { value: 'Roastery Test' },
    });
    fireEvent.change(screen.getByLabelText('Osoba kontaktowa'), {
      target: { value: 'Jan Kowalski' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'jan@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Strona / Instagram'), {
      target: { value: '@roasterytest' },
    });
    expect(screen.queryByLabelText('Liczba produktów w ofercie')).not.toBeInTheDocument();
    expect(screen.getByText('Aktywne kanały sprzedaży')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aktywne kanały sprzedaży' })).toHaveTextContent(
      'Wybierz kanały sprzedaży'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aktywne kanały sprzedaży' }));
    fireEvent.click(screen.getByRole('button', { name: /online/ }));
    fireEvent.change(
      screen.getByLabelText(
        'Czego najbardziej chcielibyście dowiedzieć się o tym, jak konsumenci odbierają Waszą kawę?'
      ),
      {
        target: { value: 'Chcemy lepiej rozumieć odbiór profilu sensorycznego.' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Zgłoś palarnię do programu' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/lead-submit',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    );

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(requestInit?.body)) as {
      fullName: string;
      email: string;
      company: string;
      message: string;
      source: string;
    };

    expect(payload).toMatchObject({
      fullName: 'Jan Kowalski',
      email: 'jan@example.com',
      company: 'Roastery Test',
      source: 'partner_program_home',
    });
    expect(payload.message).toContain('Zgłoszenie do Programu Partnerów Branżowych');
    expect(payload.message).toContain('Kanały sprzedaży: online');
    expect(payload.message).not.toContain('Liczba produktów w ofercie');
  });

  it('does not block partner program submission when sales channel is not selected', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ message: 'ok' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<PublicLeadForm variant="partnerProgram" submitLabel="Zgłoś palarnię do programu" />);

    fireEvent.change(screen.getByLabelText('Nazwa palarni'), {
      target: { value: 'Roastery Test' },
    });
    fireEvent.change(screen.getByLabelText('Osoba kontaktowa'), {
      target: { value: 'Jan Kowalski' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'jan@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Strona / Instagram'), {
      target: { value: '@roasterytest' },
    });
    expect(screen.queryByLabelText('Liczba produktów w ofercie')).not.toBeInTheDocument();
    expect(screen.getByText('Aktywne kanały sprzedaży')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aktywne kanały sprzedaży' })).toHaveTextContent(
      'Wybierz kanały sprzedaży'
    );
    fireEvent.change(
      screen.getByLabelText(
        'Czego najbardziej chcielibyście dowiedzieć się o tym, jak konsumenci odbierają Waszą kawę?'
      ),
      {
        target: { value: 'Chcemy lepiej rozumieć odbiór profilu sensorycznego.' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Zgłoś palarnię do programu' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(requestInit?.body)) as { message: string };

    expect(payload.message).toContain('Kanały sprzedaży: nie podano');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
