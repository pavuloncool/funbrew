import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BusinessPage from './page';

describe('BusinessPage', () => {
  it('presents the partner offer and inquiry form', () => {
    render(<BusinessPage />);

    expect(
      screen.getByRole('heading', { name: 'Commercial partners for accessories and equipment' })
    ).toBeInTheDocument();
    expect(screen.getByText('Product storytelling')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start a partnership' })).toBeInTheDocument();
  });
});
