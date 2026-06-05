import { createClient } from 'npm:@supabase/supabase-js@2'
import QRCode from 'npm:qrcode@1.5.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

async function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey)
}

async function requireRoaster(req: Request) {
  const admin = await createAdminClient()
  if (!admin) return { error: json(500, { error: 'server_error', message: 'Supabase env is not configured.' }) }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: json(401, { error: 'unauthorized', message: 'Valid session required.' }) }
  }

  const token = authHeader.slice('Bearer '.length)
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token)

  if (userError || !user) {
    return { error: json(401, { error: 'unauthorized', message: 'Valid session required.' }) }
  }

  const roasterResult = await admin
    .from('roasters')
    .select('id, verification_status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roasterResult.error) {
    return { error: json(500, { error: 'server_error', message: roasterResult.error.message }) }
  }

  if (!roasterResult.data) {
    return { error: json(404, { error: 'not_found', message: 'Roaster profile not found.' }) }
  }

  return {
    admin,
    roaster: roasterResult.data as { id: string; verification_status: string | null },
  }
}

function resolveOrigin(): string {
  const raw =
    Deno.env.get('APP_PUBLIC_URL') ??
    Deno.env.get('NEXT_PUBLIC_APP_URL') ??
    'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const auth = await requireRoaster(req)
    if ('error' in auth) return auth.error

    const body = asRecord(await req.json().catch(() => null))
    const batchId = asString(body?.batchId)
    if (!batchId) {
      return json(400, { error: 'bad_request', message: 'batchId is required.' })
    }

    const admin = auth.admin
    const batchResult = await admin
      .from('roast_batches')
      .select('id, lot_number, coffee_id')
      .eq('id', batchId)
      .maybeSingle()

    if (batchResult.error) {
      return json(500, { error: 'server_error', message: batchResult.error.message })
    }
    if (!batchResult.data) {
      return json(404, { error: 'not_found', message: 'Batch not found.' })
    }

    const batch = batchResult.data as { id: string; lot_number: string; coffee_id: string }
    const coffeeResult = await admin
      .from('coffees')
      .select('id, roaster_id')
      .eq('id', batch.coffee_id)
      .maybeSingle()

    if (coffeeResult.error) {
      return json(500, { error: 'server_error', message: coffeeResult.error.message })
    }
    if (!coffeeResult.data) {
      return json(404, { error: 'not_found', message: 'Coffee not found for this batch.' })
    }

    const coffee = coffeeResult.data as { id: string; roaster_id: string }
    if (coffee.roaster_id !== auth.roaster.id) {
      return json(403, { error: 'forbidden', message: 'This batch does not belong to your roastery.' })
    }
    const existingQrResult = await admin
      .from('qr_codes')
      .select('hash, qr_url')
      .eq('batch_id', batchId)
      .maybeSingle()

    if (existingQrResult.error) {
      return json(500, { error: 'server_error', message: existingQrResult.error.message })
    }

    const existingQr = existingQrResult.data as { hash: string; qr_url: string } | null
    const created = !existingQr
    const hash = existingQr?.hash ?? crypto.randomUUID()
    const url = `${resolveOrigin()}/q/${hash}`

    if (!existingQr) {
      const insertResult = await admin.from('qr_codes').insert({
        batch_id: batchId,
        hash,
        qr_url: url,
        svg_storage_path: `generated/${batchId}.svg`,
        png_storage_path: `generated/${batchId}.png`,
      })
      if (insertResult.error) {
        return json(500, { error: 'server_error', message: insertResult.error.message })
      }
    }

    const [svg, pngDataUrl] = await Promise.all([
      QRCode.toString(url, { type: 'svg', margin: 1, width: 256 }),
      QRCode.toDataURL(url, { margin: 1, width: 256 }),
    ])

    return json(200, {
      created,
      hash,
      lotNumber: batch.lot_number,
      svg,
      png: pngDataUrl.replace(/^data:image\/png;base64,/, ''),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return json(500, { error: 'server_error', message })
  }
})
