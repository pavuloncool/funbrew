import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

import type { Database } from '../../../../../supabase/types/database';

export const runtime = 'nodejs';

type RoasterCoffeeTagRow = Database['public']['Tables']['roaster_coffee_tags']['Row'];
type RoasterRow = Database['public']['Tables']['roasters']['Row'];

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
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
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
    return NextResponse.json({ error: 'bad_request', message: 'Invalid JSON.' }, { status: 400 });
  }

  const tagId =
    typeof body === 'object' && body !== null && 'tagId' in body
      ? (body as { tagId: unknown }).tagId
      : undefined;

  if (typeof tagId !== 'string' || !UUID_RE.test(tagId)) {
    return NextResponse.json(
      { error: 'bad_request', message: 'Valid tagId (UUID) is required.' },
      { status: 400 }
    );
  }

  const { data: tag, error: tagError } = await admin
    .from('roaster_coffee_tags')
    .select(
      'id, public_hash, roaster_id, roaster_short_name, img_coffee_label, bean_origin_country, bean_origin_farm, bean_origin_tradename, bean_origin_region, bean_type, bean_varietal_main, bean_varietal_extra, bean_origin_height, bean_processing, bean_roast_date, bean_roast_level, brew_method, tasting_note_ids, created_at, updated_at'
    )
    .eq('id', tagId)
    .maybeSingle();

  if (tagError) {
    return NextResponse.json(
      { error: 'server_error', message: tagError.message },
      { status: 500 }
    );
  }

  if (!tag) {
    return NextResponse.json({ error: 'not_found', message: 'Tag not found.' }, { status: 404 });
  }

  const tagRow = tag as RoasterCoffeeTagRow;

  const { data: roaster, error: roasterError } = await admin
    .from('roasters')
    .select('id, user_id')
    .eq('id', tagRow.roaster_id)
    .maybeSingle();

  if (roasterError || !roaster) {
    return NextResponse.json({ error: 'not_found', message: 'Roaster not found.' }, { status: 404 });
  }

  const roasterRow = roaster as RoasterRow;

  if (roasterRow.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden', message: 'Not your tag.' }, { status: 403 });
  }

  const origin = resolveOrigin(request);
  const url = `${origin}/q/${tagRow.public_hash}`;

  const [svg, pngBuffer] = await Promise.all([
    QRCode.toString(url, { type: 'svg', margin: 1, width: 256 }),
    QRCode.toBuffer(url, { type: 'png', margin: 1, width: 256 }),
  ]);

  const png = pngBuffer.toString('base64');

  return NextResponse.json({ svg, png, url });
}
