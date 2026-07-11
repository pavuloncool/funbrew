import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ContactPage from './page';

describe('ContactPage', () => {
  it('renders the roaster contact form and context', () => {
    render(<ContactPage />);

    expect(screen.getByRole('heading', { name: 'Talk to fun•brew' })).toBeInTheDocument();
    expect(screen.getByText('Contact details')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'roasters@funbrew.site' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+48 691 810 000' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Support' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Business' })).not.toBeInTheDocument();
    expect(screen.queryByText('Good topics for the form')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full name*')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email*')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Company*')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your message*')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });
});
