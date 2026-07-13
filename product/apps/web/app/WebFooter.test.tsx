import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import WebFooter from '@/components/WebFooter';

describe('WebFooter', () => {
  it('links to the privacy policy', () => {
    render(<WebFooter />);

    expect(screen.getByRole('link', { name: 'Polityka prywatności' })).toHaveAttribute('href', '/privacy');
  });
});
