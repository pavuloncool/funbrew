import { describe, expect, it } from 'vitest';

import { authWebShellClasses } from './authWebShellClasses';
describe('authWebShellClasses', () => {
  it('keeps neutral page shell classes', () => {
    expect(authWebShellClasses.page).toContain('bg-neutral-50');
    expect(authWebShellClasses.page).toContain('text-neutral-900');
  });

  it('uses neutral input and error classes', () => {
    expect(authWebShellClasses.input).toContain('border-neutral-400');
    expect(authWebShellClasses.err).toContain('text-red-600');
  });
});
