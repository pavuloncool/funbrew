import { APIRequestContext, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export type TestActor = {
  email: string;
  password: string;
  userId: string;
  accessToken: string;
  roasterId: string;
  roasterName: string;
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
  const response = await request.post(`${supabaseUrl}/rest/v1/roasters?select=id`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: {
      user_id: userId,
      name: roasterName,
      verification_status: 'verified',
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as Array<{ id: string }>;
  return body[0].id;
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
  const roasterId = await createRoaster(request, userId, roasterName, serviceRoleKey, url);

  return { email, password, userId, accessToken, roasterId, roasterName };
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
  const coffee = coffees[0];

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
        coffee_id: coffee.id,
        lot_number: `LOT-${Date.now()}`,
        roast_date: '2026-04-08',
        status: 'active',
      },
    }
  );
  expect(batchResponse.ok()).toBeTruthy();
  const batches = (await batchResponse.json()) as Array<{ id: string; lot_number: string }>;
  const batch = batches[0];

  return { coffee, batch };
}
