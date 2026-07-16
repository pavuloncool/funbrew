import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ResearchScopePage from './page';

describe('ResearchScopePage', () => {
  it('renders the full research questions section', () => {
    render(<ResearchScopePage />);

    expect(screen.getByRole('heading', { name: /zakres insightów \+.*workflow fun•brew/ })).toBeInTheDocument();
    expect(screen.getByText('Jaki rodzaj feedbacku może zwiększyć codzienną ekspozycję na kupujących?')).toBeInTheDocument();
    expect(screen.getByText(/Jak wpisać workflow/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Wróć do Programu Partnerów' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Dalej w programie')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Stan na dzisiaj/ })).toHaveAttribute('href', '/stan-na-dzisiaj');
    expect(screen.getByRole('link', { name: /Jak to robimy/ })).toHaveAttribute('href', '/jak-to-robimy');
    expect(screen.getByRole('heading', { name: 'Porozmawiajmy o udziale' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'roasters@funbrew.site' })).toHaveAttribute(
      'href',
      'mailto:roasters@funbrew.site?subject=Web%20Inquiry%20from%20Landing'
    );
    expect(screen.getByRole('button', { name: 'Zgłoś palarnię' })).toBeInTheDocument();
  });
});
