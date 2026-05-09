import { describe, expect, it } from 'vitest';

import { authWebShellClasses } from './authWebShellClasses';
describe('authWebShellClasses', () => {
  it('keeps token-based page shell classes', () => {
    expect(authWebShellClasses.page).toContain('bg-vs-canvas');
    expect(authWebShellClasses.page).toContain('text-vs-text-primary');
  });

  it('uses token-based input and semantic error classes', () => {
    expect(authWebShellClasses.input).toContain('border-vs-border-default');
    expect(authWebShellClasses.err).toContain('text-vs-danger');
  });
});
