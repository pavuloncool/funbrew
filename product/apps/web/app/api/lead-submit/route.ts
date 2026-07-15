import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type LeadSubmitPayload = {
  fullName?: unknown;
  email?: unknown;
  company?: unknown;
  message?: unknown;
  source?: unknown;
  subject?: unknown;
  turnstileToken?: unknown;
};

type TurnstileSiteverifyResponse = {
  success?: boolean;
  'error-codes'?: string[];
};

function asTrimmedString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : '';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getRequestIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers
      .get('x-forwarded-for')
      ?.split(',')[0]
      ?.trim() ??
    ''
  );
}

async function verifyTurnstileToken(token: string, secretKey: string, request: Request): Promise<boolean> {
  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);

  const remoteIp = getRequestIp(request);
  if (remoteIp) {
    formData.append('remoteip', remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });
  const payload = (await response.json().catch(() => null)) as TurnstileSiteverifyResponse | null;

  return response.ok && payload?.success === true;
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'server_error', message: 'Supabase env is not configured.' },
      { status: 500 }
    );
  }

  let body: LeadSubmitPayload;
  try {
    body = (await request.json()) as LeadSubmitPayload;
  } catch {
    return NextResponse.json({ error: 'bad_request', message: 'Invalid JSON.' }, { status: 400 });
  }

  const fullName = asTrimmedString(body.fullName);
  const email = asTrimmedString(body.email).toLowerCase();
  const company = asTrimmedString(body.company);
  const message = asTrimmedString(body.message);
  const source = asTrimmedString(body.source) || 'web_public_entry';
  const subject = asTrimmedString(body.subject);
  const turnstileToken = asTrimmedString(body.turnstileToken);

  if (!fullName || !email || !company) {
    return NextResponse.json(
      { error: 'bad_request', message: 'fullName, email and company are required.' },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Please provide a valid email.' },
      { status: 400 }
    );
  }
  if (
    fullName.length > 120 ||
    email.length > 320 ||
    company.length > 160 ||
    message.length > 4000 ||
    source.length > 64 ||
    subject.length > 160 ||
    turnstileToken.length > 2048
  ) {
    return NextResponse.json(
      { error: 'bad_request', message: 'One or more fields exceed allowed length.' },
      { status: 400 }
    );
  }

  if (turnstileSecretKey) {
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'turnstile_required', message: 'Please complete the anti-spam check.' },
        { status: 400 }
      );
    }

    let turnstileVerified = false;
    try {
      turnstileVerified = await verifyTurnstileToken(turnstileToken, turnstileSecretKey, request);
    } catch {
      return NextResponse.json(
        { error: 'turnstile_unreachable', message: 'Anti-spam verification is temporarily unavailable.' },
        { status: 400 }
      );
    }

    if (!turnstileVerified) {
      return NextResponse.json(
        { error: 'turnstile_failed', message: 'Anti-spam verification failed. Please try again.' },
        { status: 400 }
      );
    }
  }

  const leadSubmitFunction = process.env.LEAD_SUBMIT_FUNCTION ?? 'submit_contact_lead';
  const normalizedUrl = supabaseUrl.replace(/\/$/, '');

  let response: Response;
  try {
    response = await fetch(`${normalizedUrl}/functions/v1/${leadSubmitFunction}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        company,
        message: message || null,
        source,
        subject: subject || null,
        metadata: {
          origin: request.headers.get('origin'),
          user_agent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          forwarded_for: request.headers.get('x-forwarded-for'),
          email_subject: subject || null,
          turnstile_verified: Boolean(turnstileSecretKey),
        },
      }),
    });
  } catch {
    return NextResponse.json(
      { error: 'server_error', message: 'Lead submit backend is unreachable.' },
      { status: 502 }
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; error?: string; lead_id?: string }
    | null;

  if (!response.ok) {
    return NextResponse.json(
      {
        error: payload?.error ?? 'server_error',
        message: payload?.message ?? 'Could not save your request. Please retry.',
      },
      { status: response.status }
    );
  }

  return NextResponse.json({
    ok: true,
    leadSaved: true,
    leadId: payload?.lead_id ?? null,
    message: payload?.message ?? 'Contact request submitted successfully.',
  });
}
