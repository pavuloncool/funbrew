import { describe, expect, it } from 'vitest';

import { requiresPasswordChange, resolveAccountRole } from './accountRole';

describe('resolveAccountRole', () => {
  it('returns roaster when a roaster row exists for the user', async () => {
    const supabase = {
      from: (table: string) => ({
        select: (_columns: string) => ({
          eq: (_column: string, value: string) => ({
            maybeSingle: async () => ({
              data: table === 'roasters' && value === 'user-roaster' ? { id: 'roaster-1' } : null,
              error: null,
            }),
          }),
        }),
      }),
    } as never;

    await expect(resolveAccountRole(supabase, 'user-roaster')).resolves.toBe('roaster');
  });

  it('prefers explicit app_role from user metadata', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              throw new Error('should not query roasters when app_role is set');
            },
          }),
        }),
      }),
    } as never;

    await expect(resolveAccountRole(supabase, 'user-consumer', { app_role: 'consumer' })).resolves.toBe('consumer');
    await expect(resolveAccountRole(supabase, 'user-roaster', { app_role: 'roaster' })).resolves.toBe('roaster');
  });

  it('returns consumer when no roaster row exists for the user', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    } as never;

    await expect(resolveAccountRole(supabase, 'user-consumer')).resolves.toBe('consumer');
  });

  it('ignores invalid app_role metadata and falls back to roasters lookup', async () => {
    const supabase = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: table === 'roasters' ? { id: 'roaster-2' } : null,
              error: null,
            }),
          }),
        }),
      }),
    } as never;

    await expect(
      resolveAccountRole(supabase, 'user-roaster-fallback', { app_role: 'Roaster' })
    ).resolves.toBe('roaster');
  });

  it('throws when the roaster lookup fails', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: null,
              error: { message: 'lookup failed' },
            }),
          }),
        }),
      }),
    } as never;

    await expect(resolveAccountRole(supabase, 'user-error')).rejects.toThrow('lookup failed');
  });

  it('detects password-change requirement from auth metadata', () => {
    expect(requiresPasswordChange({ must_change_password: true })).toBe(true);
    expect(requiresPasswordChange({ must_change_password: false })).toBe(false);
    expect(requiresPasswordChange({ must_change_password: 'true' })).toBe(false);
    expect(requiresPasswordChange(null)).toBe(false);
  });
});
