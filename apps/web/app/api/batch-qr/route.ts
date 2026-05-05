import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

import type { Database } from '../../../../../supabase/types/database';

export const runtime = 'nodejs';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  return host ? `${proto}://${host}` : 'http://localhost:3000';
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
    return NextResponse.json(
      { error: 'bad_request', message: 'Invalid JSON.' },
      { status: 400 }
    );
  }

  const batchId =
    typeof body === 'object' && body !== null && 'batchId' in body
      ? (body as { batchId: unknown }).batchId
      : undefined;

  if (typeof batchId !== 'string' || !UUID_RE.test(batchId)) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Valid batchId (UUID) is required.' },
      { status: 400 }
    );
  }

  const { data: batch, error: batchError } = await admin
    .from('roast_batches')
    .select('id, coffee_id, lot_number')
    .eq('id', batchId)
    .maybeSingle();

  if (batchError) {
    return NextResponse.json(
      { error: 'server_error', message: batchError.message },
      { status: 500 }
    );
  }

  if (!batch) {
    return NextResponse.json(
      { error: 'not_found', message: 'Batch not found.' },
      { status: 404 }
    );
  }

  const batchRow = batch as { id: string; coffee_id: string; lot_number: string };

  const { data: coffee, error: coffeeError } = await admin
    .from('coffees')
    .select('id, roaster_id')
    .eq('id', batchRow.coffee_id)
    .maybeSingle();

  if (coffeeError) {
    return NextResponse.json(
      { error: 'server_error', message: coffeeError.message },
      { status: 500 }
    );
  }

  if (!coffee) {
    return NextResponse.json(
      { error: 'not_found', message: 'Coffee not found for this batch.' },
      { status: 404 }
    );
  }

  const coffeeRow = coffee as { id: string; roaster_id: string };

  const { data: roaster, error: roasterError } = await admin
    .from('roasters')
    .select('id, user_id')
    .eq('id', coffeeRow.roaster_id)
    .maybeSingle();

  if (roasterError) {
    return NextResponse.json(
      { error: 'server_error', message: roasterError.message },
      { status: 500 }
    );
  }

  if (!roaster) {
    return NextResponse.json(
      { error: 'not_found', message: 'Roaster not found for this batch.' },
      { status: 404 }
    );
  }

  const roasterRow = roaster as { id: string; user_id: string };
  if (roasterRow.user_id !== user.id) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Not your batch.' },
      { status: 403 }
    );
  }

  const { data: existingQr, error: qrError } = await admin
    .from('qr_codes')
    .select('id, hash, qr_url')
    .eq('batch_id', batchId)
    .maybeSingle();

  if (qrError) {
    return NextResponse.json(
      { error: 'server_error', message: qrError.message },
      { status: 500 }
    );
  }

  const existingQrRow = existingQr as { id: string; hash: string; qr_url: string } | null;
  const created = !existingQrRow;
  const hash = existingQrRow?.hash ?? crypto.randomUUID();
  const url = `${resolveOrigin(request)}/q/${hash}`;

  if (!existingQr) {
    const { error: insertError } = await admin.from('qr_codes').insert({
      batch_id: batchId,
      hash,
      qr_url: url,
      svg_storage_path: `generated/${batchId}.svg`,
      png_storage_path: `generated/${batchId}.png`,
    } as never);

    if (insertError) {
      return NextResponse.json(
        { error: 'server_error', message: insertError.message },
        { status: 500 }
      );
    }
  }

  const [svg, pngBuffer] = await Promise.all([
    QRCode.toString(url, { type: 'svg', margin: 1, width: 256 }),
    QRCode.toBuffer(url, { type: 'png', margin: 1, width: 256 }),
  ]);

  return NextResponse.json({
    created,
    hash,
    lotNumber: batchRow.lot_number,
    url,
    svg,
    png: pngBuffer.toString('base64'),
  });
}
