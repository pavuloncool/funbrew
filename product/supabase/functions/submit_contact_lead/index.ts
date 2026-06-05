import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type ContactLeadRequest = {
  full_name?: string;
  email?: string;
  company?: string | null;
  message?: string | null;
  source?: string;
  metadata?: unknown;
};

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildEmailText(params: {
  leadId: string;
  createdAt: string;
  fullName: string;
  email: string;
  company: string;
  message: string | null;
  source: string;
  metadata: Record<string, unknown>;
}): string {
  const metadataString =
    Object.keys(params.metadata).length > 0
      ? JSON.stringify(params.metadata, null, 2)
      : '{}';

  return [
    'New beta contact lead received.',
    '',
    `Lead ID: ${params.leadId}`,
    `Created at: ${params.createdAt}`,
    `Name: ${params.fullName}`,
    `Email: ${params.email}`,
    `Company: ${params.company}`,
    `Source: ${params.source}`,
    '',
    'Message:',
    params.message ?? '-',
    '',
    'Metadata:',
    metadataString,
  ].join('\n');
}

async function trySendNotificationEmail(params: {
  leadId: string;
  createdAt: string;
  fullName: string;
  email: string;
  company: string;
  message: string | null;
  source: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const toRaw = Deno.env.get('CONTACT_NOTIFICATION_TO') ?? '';
  const recipients = toRaw
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.warn('contact_notification_skipped_missing_recipients', {
      lead_id: params.leadId,
    });
    return;
  }

  const provider = (Deno.env.get('CONTACT_NOTIFICATION_PROVIDER') ?? 'resend').toLowerCase();
  if (provider !== 'resend') {
    console.warn('contact_notification_skipped_unknown_provider', {
      lead_id: params.leadId,
      provider,
    });
    return;
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const fromEmail = Deno.env.get('CONTACT_NOTIFICATION_FROM') ?? '';
  if (!resendApiKey || !fromEmail) {
    console.warn('contact_notification_skipped_missing_provider_config', {
      lead_id: params.leadId,
      provider,
    });
    return;
  }

  const subject = `[funcup beta] New contact lead from ${params.fullName}`;
  const text = buildEmailText(params);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: recipients,
      subject,
      text,
      reply_to: params.email,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API failed (${response.status}): ${body.slice(0, 400)}`);
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'method_not_allowed', message: 'Use POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({
          error: 'config_error',
          message: 'Missing Supabase server configuration.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await req.json()) as ContactLeadRequest;

    const fullName = normalizeText(body.full_name);
    const email = normalizeText(body.email).toLowerCase();
    const companyRaw = normalizeText(body.company);
    const message = normalizeText(body.message);
    const source = normalizeText(body.source) || 'web_public_beta';

    if (!fullName || fullName.length > 120) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'full_name is required and must be 1-120 chars.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!email || email.length > 320 || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'email is required and must be valid.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!companyRaw || companyRaw.length > 160) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'company is required and must be 1-160 chars.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (message.length > 4000) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'message must be <= 4000 chars when provided.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (source.length > 64) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'source must be <= 64 chars.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const metadataBase = isObject(body.metadata) ? body.metadata : {};
    const requestMetadata: Record<string, unknown> = {
      ...metadataBase,
      request: {
        ip: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent'),
        referer: req.headers.get('referer'),
      },
    };

    const metadataText = JSON.stringify(requestMetadata);
    if (metadataText.length > 10_000) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'metadata payload too large.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: leadRow, error: insertError } = await supabase
      .from('contact_leads')
      .insert({
        full_name: fullName,
        email,
        company: companyRaw,
        message: message || null,
        source,
        metadata: requestMetadata,
      })
      .select('id, created_at')
      .single();

    if (insertError || !leadRow) {
      return new Response(
        JSON.stringify({ error: 'insert_failed', message: insertError?.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      await trySendNotificationEmail({
        leadId: leadRow.id,
        createdAt: leadRow.created_at,
        fullName,
        email,
        company: companyRaw,
        message: message || null,
        source,
        metadata: requestMetadata,
      });
    } catch (emailError) {
      console.error('contact_notification_failed', {
        lead_id: leadRow.id,
        error: emailError instanceof Error ? emailError.message : 'unknown_error',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: leadRow.id,
        message: 'Contact request submitted successfully.',
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';
    return new Response(
      JSON.stringify({ error: 'server_error', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
