import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ProgramProcessPage from './page';

describe('ProgramProcessPage', () => {
  it('renders the full program process section', () => {
    render(<ProgramProcessPage />);

    expect(screen.getByRole('heading', { name: 'Gdzie zaczynamy + na czym kończymy' })).toBeInTheDocument();
    expect(screen.getByText('Poznajemy się')).toBeInTheDocument();
    expect(screen.getByText('Dostrajamy mobile')).toBeInTheDocument();
    expect(screen.getByText('Omawiamy feedback')).toBeInTheDocument();
    expect(screen.getByText('Dalej w programie')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Co badamy/ })).toHaveAttribute('href', '/co-badamy');
    expect(screen.getByRole('link', { name: /Co w zamian/ })).toHaveAttribute('href', '/co-w-zamian');
    expect(screen.getByRole('heading', { name: 'Porozmawiajmy o udziale' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'roasters@funbrew.site' })).toHaveAttribute(
      'href',
      'mailto:roasters@funbrew.site?subject=Web%20Inquiry%20from%20Landing'
    );
    expect(screen.getByRole('button', { name: 'Zgłoś palarnię' })).toBeInTheDocument();
  });
});
