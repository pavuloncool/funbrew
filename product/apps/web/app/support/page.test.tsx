import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SupportPage from './page';

describe('SupportPage', () => {
  it('describes the setup flow for roasters', () => {
    render(<SupportPage />);

    expect(screen.getByRole('heading', { name: 'Support for setup, publishing, and QR flow' })).toBeInTheDocument();
    expect(screen.getByText('Prepare the roaster profile')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact support' })).toBeInTheDocument();
  });
});
