import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AboutPage from './page';

describe('AboutPage', () => {
  it('explains the roaster data loop', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { name: 'What fun•brew does for roasters' })).toBeInTheDocument();
    expect(screen.getByText('Publish roaster data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Commercial partners' })).toBeInTheDocument();
  });
});
