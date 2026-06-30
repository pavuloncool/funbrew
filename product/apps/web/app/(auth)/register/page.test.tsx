import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RegisterPage from './page';

describe('RegisterPage', () => {
  it('renders the roaster landing page instead of a signup form', () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole('heading', { name: 'Turn coffee batches into structured product data' })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Company')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('What do you want to achieve with fun•brew? (optional)')
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/password/i)).not.toBeInTheDocument();
  });
});
