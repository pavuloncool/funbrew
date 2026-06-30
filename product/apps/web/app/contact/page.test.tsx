import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ContactPage from './page';

describe('ContactPage', () => {
  it('renders the roaster contact form and context', () => {
    render(<ContactPage />);

    expect(screen.getByRole('heading', { name: 'Talk to fun•brew' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Company')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });
});
