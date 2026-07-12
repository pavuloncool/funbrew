import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage', () => {
  it('renders the partner program landing page and lead form', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { name: 'Zobacz, co dzieje się z Twoją kawą po zakupie.' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Program Partnerów Branżowych')[0]).toBeInTheDocument();
    expect(
      screen.getAllByText('Dla palarni, które chcą współtworzyć standard danych konsumenckich w kawie specialty.')[0]
    ).toBeInTheDocument();
    expect(screen.getByText('Czy feedback konsumenta pomaga lepiej opisać kawę?')).toBeInTheDocument();
    expect(screen.getByText('Wcześniejszy dostęp do wersji komercyjnej')).toBeInTheDocument();
    expect(screen.getByText('Preferencyjne warunki membership')).toBeInTheDocument();
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
