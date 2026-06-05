import { APIRequestContext, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export type TestActor = {
  email: string;
  password: string;
  userId: string;
  accessToken: string;
  roasterId: string;
  roasterName: string;
  customerNumber: string;
};

export type ConsumerTestActor = {
  email: string;
  password: string;
  userId: string;
  accessToken: string;
};

function mustGetEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing env: one of [${names.join(', ')}]`);
}

export function supabaseEnv() {
  return {
    url:
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      'http://127.0.0.1:54321',
    anonKey: mustGetEnv('SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: mustGetEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

async function createUser(
  request: APIRequestContext,
  email: string,
  password: string,
  serviceRoleKey: string,
  supabaseUrl: string
) {
  const response = await request.post(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: email.split('@')[0] },
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { id: string };
  return body.id;
}

async function signIn(
  request: APIRequestContext,
  email: string,
  password: string,
  anonKey: string,
  supabaseUrl: string
) {
  const response = await request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      data: { email, password },
    }
  );
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

async function createRoaster(
  request: APIRequestContext,
  userId: string,
  roasterName: string,
  serviceRoleKey: string,
  supabaseUrl: string
) {
  const response = await request.post(`${supabaseUrl}/rest/v1/roasters?select=id,customer_number`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: {
      user_id: userId,
      name: roasterName,
      company_name: roasterName,
      roaster_short_name: roasterName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'phase4-roaster',
      city: 'Warsaw',
      country: 'Poland',
      verification_status: 'verified',
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as Array<{ id: string; customer_number: string }>;
  expect(body[0]?.customer_number).toMatch(/^\d{6}$/);
  return body[0];
}

export async function provisionVerifiedRoaster(
  request: APIRequestContext,
  label: string
): Promise<TestActor> {
  const { url, anonKey, serviceRoleKey } = supabaseEnv();
  const seed = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const email = `phase4-${seed}-${Date.now()}@example.com`;
  const password = `Phase4!${randomUUID().slice(0, 8)}`;

  const userId = await createUser(request, email, password, serviceRoleKey, url);
  const accessToken = await signIn(request, email, password, anonKey, url);
  const roasterName = `Phase4 ${label}`;
  const roaster = await createRoaster(request, userId, roasterName, serviceRoleKey, url);

  return {
    email,
    password,
    userId,
    accessToken,
    roasterId: roaster.id,
    roasterName,
    customerNumber: roaster.customer_number,
  };
}

export async function provisionConsumer(
  request: APIRequestContext,
  label: string
): Promise<ConsumerTestActor> {
  const { url, anonKey, serviceRoleKey } = supabaseEnv();
  const seed = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const email = `phase4-consumer-${seed}-${Date.now()}@example.com`;
  const password = `Phase4!${randomUUID().slice(0, 8)}`;

  const userId = await createUser(request, email, password, serviceRoleKey, url);
  const accessToken = await signIn(request, email, password, anonKey, url);

  return { email, password, userId, accessToken };
}

export async function getBrewMethodId(
  request: APIRequestContext,
  name: string
): Promise<string> {
  const { url, serviceRoleKey } = supabaseEnv();
  const response = await request.get(
    `${url}/rest/v1/brew_methods?select=id&name=eq.${encodeURIComponent(name)}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as Array<{ id: string }>;
  expect(body[0]?.id).toBeTruthy();
  return body[0].id;
}

export async function logConsumerTasting(params: {
  request: APIRequestContext;
  consumer: ConsumerTestActor;
  batchId: string;
  rating: number;
  brewMethodId: string;
  freeTextNotes?: string;
  review?: string;
  tastingNoteIds?: string[];
}) {
  const { url, anonKey } = supabaseEnv();
  const response = await params.request.post(`${url}/functions/v1/log_tasting`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${params.consumer.accessToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      batch_id: params.batchId,
      rating: params.rating,
      brew_method_id: params.brewMethodId,
      free_text_notes: params.freeTextNotes,
      review: params.review,
      tasting_note_ids: params.tastingNoteIds,
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { coffee_log_id?: string };
  expect(body.coffee_log_id).toBeTruthy();
  return { coffeeLogId: body.coffee_log_id as string };
}

export async function refreshCoffeeStats(params: {
  request: APIRequestContext;
  batchId: string;
  consumer: ConsumerTestActor;
}) {
  const { url, anonKey } = supabaseEnv();
  const response = await params.request.post(`${url}/functions/v1/update_coffee_stats`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${params.consumer.accessToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      batch_id: params.batchId,
      user_id: params.consumer.userId,
    },
  });
  expect(response.ok()).toBeTruthy();
}

export async function insertTelemetryForLog(params: {
  request: APIRequestContext;
  coffeeLogId: string;
  brewMethodId: string;
}) {
  const { url, serviceRoleKey } = supabaseEnv();
  const telemetryResponse = await params.request.post(
    `${url}/rest/v1/coffee_log_telemetry_core`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: {
        coffee_log_id: params.coffeeLogId,
        brew_method_id: params.brewMethodId,
        overall_rating: 4,
        sensory_acidity: 4,
        sensory_sweetness: 5,
        sensory_body: 3,
        sensory_bitter: 2,
        sensory_aftertaste: 4,
        repurchase_intent: 'yes',
        experience_level: 'advanced',
      },
    }
  );
  expect(telemetryResponse.ok()).toBeTruthy();
}

/** Inserts a `qr_codes` row for E2E / smoke (replaces removed `generate_qr` Edge flow). */
export async function insertQrCodeForBatch(
  request: APIRequestContext,
  batchId: string,
  hash: string,
  label: string
) {
  const { url, serviceRoleKey } = supabaseEnv();
  const response = await request.post(`${url}/rest/v1/qr_codes`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    data: {
      batch_id: batchId,
      hash,
      qr_url: `http://127.0.0.1:3000/q/${hash}`,
      svg_storage_path: `e2e/${label}.svg`,
      png_storage_path: `e2e/${label}.png`,
    },
  });
  expect(response.ok()).toBeTruthy();
}

export async function createCoffeeAndBatch(
  request: APIRequestContext,
  actor: TestActor,
  label: string
) {
  const coffee = await createCoffeeOnly(request, actor, label);
  const batch = await createBatchForCoffee(request, coffee.id, label);
  return { coffee, batch };
}

export async function createCoffeeOnly(
  request: APIRequestContext,
  actor: TestActor,
  label: string
) {
  const { url, serviceRoleKey } = supabaseEnv();

  const coffeeResponse = await request.post(`${url}/rest/v1/coffees?select=id,name`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: {
      roaster_id: actor.roasterId,
      name: `Coffee ${label}`,
      status: 'active',
    },
  });
  expect(coffeeResponse.ok()).toBeTruthy();
  const coffees = (await coffeeResponse.json()) as Array<{ id: string; name: string }>;
  return coffees[0];
}

export async function createBatchForCoffee(
  request: APIRequestContext,
  coffeeId: string,
  label: string
) {
  const { url, serviceRoleKey } = supabaseEnv();
  const batchResponse = await request.post(
    `${url}/rest/v1/roast_batches?select=id,lot_number`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      data: {
        coffee_id: coffeeId,
        lot_number: `LOT-${Date.now()}`,
        roast_date: '2026-04-08',
        status: 'active',
      },
    }
  );
  expect(batchResponse.ok()).toBeTruthy();
  const batches = (await batchResponse.json()) as Array<{ id: string; lot_number: string }>;
  return batches[0];
}

export async function updateBatchDeclaredTelemetry(params: {
  request: APIRequestContext;
  batchId: string;
  declaredSensoryAcidity?: number | null;
  declaredSensorySweetness?: number | null;
  declaredSensoryBody?: number | null;
  declaredSensoryBitter?: number | null;
  declaredSensoryAftertaste?: number | null;
}) {
  const { url, serviceRoleKey } = supabaseEnv();
  const response = await params.request.patch(
    `${url}/rest/v1/roast_batches?id=eq.${params.batchId}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: {
        declared_sensory_acidity:
          params.declaredSensoryAcidity === undefined ? undefined : params.declaredSensoryAcidity,
        declared_sensory_sweetness:
          params.declaredSensorySweetness === undefined ? undefined : params.declaredSensorySweetness,
        declared_sensory_body:
          params.declaredSensoryBody === undefined ? undefined : params.declaredSensoryBody,
        declared_sensory_bitter:
          params.declaredSensoryBitter === undefined ? undefined : params.declaredSensoryBitter,
        declared_sensory_aftertaste:
          params.declaredSensoryAftertaste === undefined ? undefined : params.declaredSensoryAftertaste,
      },
    }
  );
  expect(response.ok()).toBeTruthy();
}
