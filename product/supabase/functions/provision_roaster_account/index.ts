import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type ProvisionRoasterAccountRequest = {
  email?: unknown;
  company_name?: unknown;
  roaster_short_name?: unknown;
  contact_name?: unknown;
  city?: unknown;
  country?: unknown;
  verification_status?: unknown;
  lead_id?: unknown;
};

type ContactLeadRow = {
  id: string;
  metadata: Record<string, unknown> | null;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return normalized.length > 0 ? normalized : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isVerificationStatus(value: string): value is 'pending' | 'verified' | 'revoked' {
  return value === 'pending' || value === 'verified' || value === 'revoked';
}

function randomInt(maxExclusive: number): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % maxExclusive;
}

function generateTemporaryPassword(length = 16): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const specials = '!@#$%^&*';
  const alphabet = `${letters}${specials}`;
  const chars: string[] = [];

  chars.push(letters[randomInt(letters.length)]);
  chars.push(letters[randomInt(letters.length)]);
  chars.push('23456789'[randomInt(8)]);
  chars.push(specials[randomInt(specials.length)]);

  while (chars.length < length) {
    chars.push(alphabet[randomInt(alphabet.length)]);
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    const current = chars[index];
    chars[index] = chars[swapIndex];
    chars[swapIndex] = current;
  }

  return chars.join('');
}

async function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    serviceRoleKey,
    admin: createClient(supabaseUrl, serviceRoleKey),
  };
}

function requireServiceRole(req: Request, serviceRoleKey: string): Response | null {
  const authHeader = req.headers.get('Authorization');
  const apiKey = req.headers.get('apikey');

  if (
    authHeader !== `Bearer ${serviceRoleKey}` ||
    apiKey !== serviceRoleKey
  ) {
    return json(401, {
      error: 'unauthorized',
      message: 'Service role authorization is required.',
    });
  }

  return null;
}

async function loadLead(
  admin: ReturnType<typeof createClient>,
  leadId: string | null
): Promise<ContactLeadRow | null> {
  if (!leadId) return null;

  const leadResult = await admin
    .from('contact_leads')
    .select('id, metadata')
    .eq('id', leadId)
    .maybeSingle();

  if (leadResult.error) {
    throw new Error(leadResult.error.message);
  }

  return (leadResult.data as ContactLeadRow | null) ?? null;
}

async function rollbackUser(
  admin: ReturnType<typeof createClient>,
  userId: string | null
): Promise<void> {
  if (!userId) return;
  await admin.auth.admin.deleteUser(userId);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed', message: 'Use POST.' });
  }

  try {
    const adminBundle = await createAdminClient();
    if (!adminBundle) {
      return json(500, {
        error: 'server_error',
        message: 'Supabase env is not configured.',
      });
    }

    const authError = requireServiceRole(req, adminBundle.serviceRoleKey);
    if (authError) return authError;

    const body = (await req.json().catch(() => null)) as ProvisionRoasterAccountRequest | null;
    if (!body) {
      return json(400, { error: 'bad_request', message: 'Request body is required.' });
    }

    const email = normalizeString(body.email).toLowerCase();
    const companyName = normalizeString(body.company_name);
    const roasterShortName = normalizeString(body.roaster_short_name);
    const contactName = normalizeOptionalString(body.contact_name);
    const city = normalizeOptionalString(body.city);
    const country = normalizeOptionalString(body.country);
    const leadId = normalizeOptionalString(body.lead_id);
    const verificationStatusRaw = normalizeString(body.verification_status) || 'pending';

    if (!email || email.length > 320 || !isValidEmail(email)) {
      return json(400, {
        error: 'bad_request',
        message: 'email is required and must be valid.',
      });
    }

    if (!companyName || companyName.length > 128) {
      return json(400, {
        error: 'bad_request',
        message: 'company_name is required and must be 1-128 chars.',
      });
    }

    if (!roasterShortName || roasterShortName.length > 128) {
      return json(400, {
        error: 'bad_request',
        message: 'roaster_short_name is required and must be 1-128 chars.',
      });
    }

    if (contactName && contactName.length > 120) {
      return json(400, {
        error: 'bad_request',
        message: 'contact_name must be <= 120 chars when provided.',
      });
    }

    if (city && city.length > 120) {
      return json(400, {
        error: 'bad_request',
        message: 'city must be <= 120 chars when provided.',
      });
    }

    if (country && country.length > 120) {
      return json(400, {
        error: 'bad_request',
        message: 'country must be <= 120 chars when provided.',
      });
    }

    if (leadId && !isUuid(leadId)) {
      return json(400, {
        error: 'bad_request',
        message: 'lead_id must be a valid UUID when provided.',
      });
    }

    if (!isVerificationStatus(verificationStatusRaw)) {
      return json(400, {
        error: 'bad_request',
        message: 'verification_status must be pending, verified or revoked.',
      });
    }

    const admin = adminBundle.admin;
    const lead = await loadLead(admin, leadId);
    if (leadId && !lead) {
      return json(404, {
        error: 'not_found',
        message: 'Lead not found.',
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    const displayName = contactName ?? companyName;

    const userResult = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        must_change_password: true,
        roaster_contact_name: contactName,
        source: 'support_provisioning',
        lead_id: leadId,
      },
    });

    if (userResult.error || !userResult.data.user) {
      return json(500, {
        error: 'server_error',
        message: userResult.error?.message ?? 'Could not create auth user.',
      });
    }

    const userId = userResult.data.user.id;

    try {
      const roasterResult = await admin
        .from('roasters')
        .insert({
          user_id: userId,
          name: companyName,
          company_name: companyName,
          roaster_short_name: roasterShortName,
          city,
          country,
          verification_status: verificationStatusRaw,
        })
        .select('id, customer_number')
        .single();

      if (roasterResult.error || !roasterResult.data) {
        throw new Error(roasterResult.error?.message ?? 'Could not create roaster profile.');
      }

      const roaster = roasterResult.data as { id: string; customer_number: string };

      if (lead) {
        const metadata = lead.metadata && typeof lead.metadata === 'object' ? lead.metadata : {};
        const updateLeadResult = await admin
          .from('contact_leads')
          .update({
            metadata: {
              ...metadata,
              provisioning: {
                provisioned_at: new Date().toISOString(),
                user_id: userId,
                roaster_id: roaster.id,
                customer_number: roaster.customer_number,
              },
            },
          })
          .eq('id', lead.id);

        if (updateLeadResult.error) {
          throw new Error(updateLeadResult.error.message);
        }
      }

      return json(200, {
        user_id: userId,
        roaster_id: roaster.id,
        customer_number: roaster.customer_number,
        temporary_password: temporaryPassword,
      });
    } catch (error) {
      await rollbackUser(admin, userId);
      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';
    return json(500, { error: 'server_error', message });
  }
});
