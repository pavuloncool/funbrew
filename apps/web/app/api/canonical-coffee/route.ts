import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import type { Database } from '../../../../../supabase/types/database';

export const runtime = 'nodejs';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type OriginPayload = {
  country: string | null;
  region: string | null;
  farm: string | null;
  producer: string | null;
  altitude_min: number | null;
  altitude_max: number | null;
} | null;

type CoffeePayload = {
  roaster_id: string;
  origin_id: string | null;
  name: string;
  variety: string | null;
  processing_method: string | null;
  producer_notes: string | null;
  cover_image_url: string | null;
  status: string;
};

function badRequest(message: string) {
  return NextResponse.json({ error: 'bad_request', message }, { status: 400 });
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

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Valid session required.' },
      { status: 401 }
    );
  }

  const jwt = authHeader.slice('Bearer '.length);
  const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(jwt);

  if (userError || !user) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Valid session required.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid JSON.');
  }

  if (!body || typeof body !== 'object') {
    return badRequest('Body is required.');
  }

  const {
    mode,
    coffeeId,
    roasterId,
    originId,
    originPayload,
    coffeePayload,
  } = body as {
    mode?: unknown;
    coffeeId?: unknown;
    roasterId?: unknown;
    originId?: unknown;
    originPayload?: unknown;
    coffeePayload?: unknown;
  };

  if (mode !== 'create' && mode !== 'edit') {
    return badRequest('Mode must be create or edit.');
  }
  if (typeof roasterId !== 'string' || !UUID_RE.test(roasterId)) {
    return badRequest('Valid roasterId is required.');
  }
  if (mode === 'edit' && (typeof coffeeId !== 'string' || !UUID_RE.test(coffeeId))) {
    return badRequest('Valid coffeeId is required for edit mode.');
  }

  const roasterCheck = await admin
    .from('roasters')
    .select('id, user_id')
    .eq('id', roasterId)
    .maybeSingle();
  if (roasterCheck.error) {
    return NextResponse.json(
      { error: 'server_error', message: roasterCheck.error.message },
      { status: 500 }
    );
  }
  const roaster = roasterCheck.data as { id: string; user_id: string } | null;
  if (!roaster) {
    return NextResponse.json(
      { error: 'not_found', message: 'Roaster not found.' },
      { status: 404 }
    );
  }
  if (roaster.user_id !== user.id) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Not your roaster profile.' },
      { status: 403 }
    );
  }

  const nextOriginPayload = originPayload as OriginPayload;
  const nextCoffeePayload = coffeePayload as CoffeePayload | null;
  if (!nextCoffeePayload || typeof nextCoffeePayload.name !== 'string' || !nextCoffeePayload.name.trim()) {
    return badRequest('Coffee payload with name is required.');
  }

  let nextOriginId =
    typeof originId === 'string' && UUID_RE.test(originId) ? originId : null;

  if (nextOriginPayload && nextOriginId) {
    const updateOrigin = await admin
      .from('origins')
      .update(nextOriginPayload as never)
      .eq('id', nextOriginId)
      .select('id')
      .single();
    if (updateOrigin.error || !updateOrigin.data) {
      return NextResponse.json(
        { error: 'server_error', message: updateOrigin.error?.message ?? 'Unable to update origin.' },
        { status: 500 }
      );
    }
  } else if (nextOriginPayload && !nextOriginId) {
    const createOrigin = (await admin
      .from('origins')
      .insert(nextOriginPayload as never)
      .select('id')
      .single()) as { data: { id: string } | null; error: { message: string } | null };
    if (createOrigin.error || !createOrigin.data) {
      return NextResponse.json(
        { error: 'server_error', message: createOrigin.error?.message ?? 'Unable to create origin.' },
        { status: 500 }
      );
    }
    const createdOrigin = createOrigin.data as { id: string };
    nextOriginId = createdOrigin.id;
  } else if (!nextOriginPayload) {
    nextOriginId = null;
  }

  const finalCoffeePayload = {
    ...nextCoffeePayload,
    roaster_id: roasterId,
    origin_id: nextOriginId,
  };

  if (mode === 'create') {
    const createCoffee = (await admin
      .from('coffees')
      .insert(finalCoffeePayload as never)
      .select('id')
      .single()) as { data: { id: string } | null; error: { message: string } | null };
    if (createCoffee.error || !createCoffee.data) {
      return NextResponse.json(
        { error: 'server_error', message: createCoffee.error?.message ?? 'Unable to create coffee.' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      id: createCoffee.data.id,
      originId: nextOriginId,
    });
  }

  const ownedCoffee = await admin
    .from('coffees')
    .select('id, roaster_id')
    .eq('id', coffeeId as string)
    .maybeSingle();
  if (ownedCoffee.error) {
    return NextResponse.json(
      { error: 'server_error', message: ownedCoffee.error.message },
      { status: 500 }
    );
  }
  const coffee = ownedCoffee.data as { id: string; roaster_id: string } | null;
  if (!coffee) {
    return NextResponse.json(
      { error: 'not_found', message: 'Coffee not found.' },
      { status: 404 }
    );
  }
  if (coffee.roaster_id !== roasterId) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Not your coffee.' },
      { status: 403 }
    );
  }

  const updateCoffee = (await admin
    .from('coffees')
    .update(finalCoffeePayload as never)
    .eq('id', coffeeId as string)
    .eq('roaster_id', roasterId)
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string } | null };
  if (updateCoffee.error || !updateCoffee.data) {
    return NextResponse.json(
      { error: 'server_error', message: updateCoffee.error?.message ?? 'Unable to update coffee.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: updateCoffee.data.id,
    originId: nextOriginId,
  });
}
