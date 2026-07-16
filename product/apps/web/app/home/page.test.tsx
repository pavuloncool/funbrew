import { describe, expect, it, vi } from 'vitest';

import { permanentRedirect } from 'next/navigation';

import HomeRedirectPage from './page';

vi.mock('next/navigation', () => ({
  permanentRedirect: vi.fn(),
}));

describe('HomeRedirectPage', () => {
  it('redirects /home to the canonical root landing page', () => {
    HomeRedirectPage();

    expect(permanentRedirect).toHaveBeenCalledWith('/');
  });
});
