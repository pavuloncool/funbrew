import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage', () => {
  it('renders the shortened partner program landing page with section teasers and contact', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        name: 'Plus feedback. Plus dane. Plus decyzje.',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Zrzut dashboardu analityki')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Dashboard funbrew z filtrami, zakładkami analityki i panelami insightów dla palarni',
      })
    ).toHaveAttribute('src', '/roaster-analytics.png');

    expect(screen.getByRole('link', { name: /Stan na dzisiaj/i })).toHaveAttribute('href', '/stan-na-dzisiaj');
    expect(screen.getByRole('link', { name: /Co badamy/i })).toHaveAttribute('href', '/co-badamy');
    expect(screen.getByRole('link', { name: /Jak to robimy/i })).toHaveAttribute('href', '/jak-to-robimy');
    expect(screen.getByRole('link', { name: /Co w zamian/i })).toHaveAttribute('href', '/co-w-zamian');
    expect(screen.getByRole('link', { name: /Kogo zapraszamy/i })).toHaveAttribute('href', '/kogo-zapraszamy');

    expect(screen.getByRole('heading', { name: 'Porozmawiajmy o udziale w programie' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'roasters@funbrew.site' })).toHaveAttribute(
      'href',
      'mailto:roasters@funbrew.site?subject=Web%20Inquiry%20from%20Landing'
    );

    expect(screen.queryByText('Jaki rating ma dana kawa wśród użytkowników na różnym poziomie doświadczenia sensorycznego?')).not.toBeInTheDocument();
    expect(screen.queryByText('Poznajemy się')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Osoba kontaktowa')).not.toBeInTheDocument();
  });
});
