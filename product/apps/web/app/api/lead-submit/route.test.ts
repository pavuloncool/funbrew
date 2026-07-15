import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const originalEnv = process.env;

const VALID_PAYLOAD = {
  fullName: 'Jan Kowalski',
  email: 'jan@example.com',
  company: 'Roastery Test',
  message: 'Lead message',
  source: 'partner_program_home',
  subject: 'Web Inquiry from Landing',
};

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/lead-submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  };
});

afterEach(() => {
  process.env = originalEnv;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('/api/lead-submit', () => {
  it('keeps legacy behavior when TURNSTILE_SECRET_KEY is not configured', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const fetchMock = vi.fn(async () => Response.json({ message: 'ok', lead_id: 'lead-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(makeRequest(VALID_PAYLOAD));
    const payload = (await response.json()) as { ok: boolean; leadId: string };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, leadId: 'lead-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://supabase.test/functions/v1/submit_contact_lead');
  });

  it('rejects the lead before Supabase when TURNSTILE_SECRET_KEY is configured and token is missing', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret-key';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(makeRequest(VALID_PAYLOAD));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe('turnstile_required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('verifies Turnstile before forwarding the lead to Supabase', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({ message: 'ok', lead_id: 'lead-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(makeRequest({ ...VALID_PAYLOAD, turnstileToken: 'turnstile-token' }));
    const payload = (await response.json()) as { ok: boolean; leadId: string };

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true, leadId: 'lead-1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://supabase.test/functions/v1/submit_contact_lead');
  });
});
