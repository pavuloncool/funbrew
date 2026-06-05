import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type LeadSubmitPayload = {
  fullName?: unknown;
  email?: unknown;
  company?: unknown;
  message?: unknown;
};

function asTrimmedString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : '';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  if (fullName.length > 120 || email.length > 320 || company.length > 160 || message.length > 4000) {
    return NextResponse.json(
      { error: 'bad_request', message: 'One or more fields exceed allowed length.' },
      { status: 400 }
    );
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
        source: 'web_public_entry',
        metadata: {
          origin: request.headers.get('origin'),
          user_agent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          forwarded_for: request.headers.get('x-forwarded-for'),
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
