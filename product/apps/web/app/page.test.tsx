import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage', () => {
  it('renders the partner program landing page and lead form', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        name: 'Plus feedback. Plus dane. Plus decyzje.',
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Program Partnerów Branżowych')[0]).toBeInTheDocument();
    expect(screen.getByText('Dashboard analityki')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Dashboard funbrew z filtrami, zakładkami analityki i panelami insightów dla palarni',
      })
    ).toHaveAttribute('src', '/roaster-analytics.png');
    expect(screen.getByRole('heading', { name: 'zakres insightów + workflow fun•brew' })).toBeInTheDocument();
    expect(screen.getByText('Czy feedback konsumenta pomaga lepiej opisać kawę?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jeśli działasz w palarni, która:' })).toBeInTheDocument();
    expect(screen.getByText('posiada aktywną ofertę kaw specialty w sprzedaży detalicznej;')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gdzie zaczynamy+ na czym kończymy' })).toBeInTheDocument();
    expect(screen.getByText('Poznajemy się')).toBeInTheDocument();
    expect(screen.getByText('Dopinamy mobile')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Co otrzymuje palarnia' })).toBeInTheDocument();
    expect(screen.getByText('Preferencyjny dostęp do wersji produkcyjnej')).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa palarni')).toBeInTheDocument();
    expect(screen.getByLabelText('Osoba kontaktowa')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Strona / Instagram')).toBeInTheDocument();
    expect(screen.queryByLabelText('Liczba produktów w ofercie')).not.toBeInTheDocument();
    expect(screen.getByText('Aktywne kanały sprzedaży')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aktywne kanały sprzedaży' })).toHaveTextContent(
      'Wybierz kanały sprzedaży'
    );
    expect(
      screen.getByLabelText(
        'Czego najbardziej chcielibyście dowiedzieć się o tym, jak konsumenci odbierają Waszą kawę?'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zgłoś palarnię do programu' })).toBeInTheDocument();
  });
});
