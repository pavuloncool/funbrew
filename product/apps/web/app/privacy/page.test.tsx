import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PrivacyPage from './page';

describe('PrivacyPage', () => {
  it('renders the GDPR information for the partner program form', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { name: 'Polityka prywatności' })).toBeInTheDocument();
    expect(screen.getByText(/Administratorem danych osobowych jest Paweł Kuligowski/)).toBeInTheDocument();
    expect(screen.getByText(/roaster@funbrew\.site/)).toBeInTheDocument();
    expect(screen.getByText(/art\. 6 ust\. 1 lit\. f RODO/)).toBeInTheDocument();
    expect(screen.getByText(/12 miesięcy od wysłania formularza/)).toBeInTheDocument();
    expect(screen.getByText('wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych')).toBeInTheDocument();
    expect(screen.getByText(/origin, user-agent, referer oraz forwarded-for\/IP/)).toBeInTheDocument();
  });
});
