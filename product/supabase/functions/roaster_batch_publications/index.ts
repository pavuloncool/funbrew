import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    .select('id, roaster_short_name')
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
    user,
    roaster: roasterResult.data as { id: string; roaster_short_name: string | null },
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const auth = await requireRoaster(req)
    if ('error' in auth) return auth.error

    const body = asRecord(await req.json().catch(() => null))
    const mode = typeof body?.mode === 'string' ? body.mode : null

    if (mode !== 'list' && mode !== 'detail') {
      return json(400, { error: 'bad_request', message: 'Mode must be list or detail.' })
    }

    const admin = auth.admin
    const roasterId = auth.roaster.id

    const coffeesResult = await admin
      .from('coffees')
      .select('id, name, status, variety, processing_method, producer_notes, cover_image_url, origin_id')
      .eq('roaster_id', roasterId)
      .order('created_at', { ascending: false })

    if (coffeesResult.error) {
      return json(500, { error: 'server_error', message: coffeesResult.error.message })
    }

    const coffees = (coffeesResult.data ?? []) as Array<{
      id: string
      name: string
      status: string
      variety: string | null
      processing_method: string | null
      producer_notes: string | null
      cover_image_url: string | null
      origin_id: string | null
    }>

    if (coffees.length === 0) {
      return json(200, mode === 'list' ? [] : { error: 'not_found', message: 'Batch not found.' })
    }

    const coffeeById = new Map(coffees.map((coffee) => [coffee.id, coffee]))
    const coffeeIds = coffees.map((coffee) => coffee.id)

    if (mode === 'list') {
      const batchesResult = await admin
        .from('roast_batches')
        .select('id, coffee_id, lot_number, roast_date, status, brewing_notes, roaster_story, created_at')
        .in('coffee_id', coffeeIds)
        .order('roast_date', { ascending: false })

      if (batchesResult.error) {
        return json(500, { error: 'server_error', message: batchesResult.error.message })
      }

      const batches = (batchesResult.data ?? []) as Array<{
        id: string
        coffee_id: string
        lot_number: string
        roast_date: string
        status: string
        brewing_notes: string | null
        roaster_story: string | null
        created_at: string | null
      }>

      if (batches.length === 0) return json(200, [])

      const batchIds = batches.map((batch) => batch.id)
      const [qrResult, statsResult] = await Promise.all([
        admin
          .from('qr_codes')
          .select('batch_id, hash')
          .in('batch_id', batchIds)
          .order('generated_at', { ascending: false }),
        admin
          .from('coffee_stats')
          .select('batch_id, total_count, avg_rating, updated_at')
          .in('batch_id', batchIds),
      ])

      if (qrResult.error) {
        return json(500, { error: 'server_error', message: qrResult.error.message })
      }
      if (statsResult.error) {
        return json(500, { error: 'server_error', message: statsResult.error.message })
      }

      const qrByBatch = new Map<string, { hash: string }>()
      for (const row of (qrResult.data ?? []) as Array<{ batch_id: string; hash: string }>) {
        if (!qrByBatch.has(row.batch_id)) {
          qrByBatch.set(row.batch_id, { hash: row.hash })
        }
      }

      const statsByBatch = new Map<string, { total_count: number; avg_rating: number; updated_at: string | null }>()
      for (const row of (statsResult.data ?? []) as Array<{ batch_id: string; total_count: number; avg_rating: number; updated_at: string | null }>) {
        statsByBatch.set(row.batch_id, row)
      }

      const summaries = batches.flatMap((batch) => {
        const coffee = coffeeById.get(batch.coffee_id)
        if (!coffee) return []
        const qr = qrByBatch.get(batch.id) ?? null
        const stats = statsByBatch.get(batch.id) ?? null
        return [{
          batchId: batch.id,
          coffeeId: coffee.id,
          coffeeName: coffee.name,
          coffeeStatus: coffee.status,
          coffeeVariety: coffee.variety,
          coffeeProcessingMethod: coffee.processing_method,
          lotNumber: batch.lot_number,
          roastDate: batch.roast_date,
          batchStatus: batch.status,
          qrHash: qr?.hash ?? null,
          totalCount: stats?.total_count ?? 0,
          avgRating: Number(stats?.avg_rating ?? 0),
          statsUpdatedAt: stats?.updated_at ?? null,
        }]
      })

      return json(200, summaries)
    }

    const batchId = typeof body?.batchId === 'string' && body.batchId.trim() ? body.batchId.trim() : null
    if (!batchId) {
      return json(400, { error: 'bad_request', message: 'batchId is required for detail mode.' })
    }

    const batchResult = await admin
      .from('roast_batches')
      .select('id, coffee_id, lot_number, roast_date, status, brewing_notes, roaster_story, created_at')
      .eq('id', batchId)
      .maybeSingle()

    if (batchResult.error) {
      return json(500, { error: 'server_error', message: batchResult.error.message })
    }

    if (!batchResult.data) {
      return json(404, { error: 'not_found', message: 'Batch not found.' })
    }

    const batch = batchResult.data as {
      id: string
      coffee_id: string
      lot_number: string
      roast_date: string
      status: string
      brewing_notes: string | null
      roaster_story: string | null
      created_at: string | null
    }

    const coffee = coffeeById.get(batch.coffee_id)
    if (!coffee) {
      return json(404, { error: 'not_found', message: 'Coffee not found for this roaster.' })
    }

    let origin: Record<string, unknown> | null = null
    if (coffee.origin_id) {
      const originResult = await admin
        .from('origins')
        .select('country, region, farm, producer, altitude_min, altitude_max')
        .eq('id', coffee.origin_id)
        .maybeSingle()
      if (originResult.error) {
        return json(500, { error: 'server_error', message: originResult.error.message })
      }
      if (originResult.data) {
        const originRow = originResult.data as {
          country: string | null
          region: string | null
          farm: string | null
          producer: string | null
          altitude_min: number | null
          altitude_max: number | null
        }
        origin = {
          country: originRow.country,
          region: originRow.region,
          farm: originRow.farm,
          producer: originRow.producer,
          altitudeMin: originRow.altitude_min,
          altitudeMax: originRow.altitude_max,
        }
      }
    }

    const [qrResult, statsResult] = await Promise.all([
      admin
        .from('qr_codes')
        .select('hash')
        .eq('batch_id', batchId)
        .maybeSingle(),
      admin
        .from('coffee_stats')
        .select('total_count, avg_rating, updated_at')
        .eq('batch_id', batchId)
        .maybeSingle(),
    ])

    if (qrResult.error) {
      return json(500, { error: 'server_error', message: qrResult.error.message })
    }
    if (statsResult.error) {
      return json(500, { error: 'server_error', message: statsResult.error.message })
    }

    const qr = qrResult.data
      ? {
        hash: (qrResult.data as { hash: string }).hash,
      }
      : null

    const statsRow = statsResult.data as { total_count: number; avg_rating: number; updated_at: string | null } | null

    return json(200, {
      coffee: {
        id: coffee.id,
        name: coffee.name,
        status: coffee.status,
        variety: coffee.variety,
        processingMethod: coffee.processing_method,
        producerNotes: coffee.producer_notes,
        coverImageUrl: coffee.cover_image_url,
      },
      origin,
      batch: {
        id: batch.id,
        lotNumber: batch.lot_number,
        roastDate: batch.roast_date,
        status: batch.status,
        brewingNotes: batch.brewing_notes,
        roasterStory: batch.roaster_story,
        createdAt: batch.created_at,
      },
      qr,
      stats: {
        totalCount: statsRow?.total_count ?? 0,
        avgRating: Number(statsRow?.avg_rating ?? 0),
        updatedAt: statsRow?.updated_at ?? null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return json(500, { error: 'server_error', message })
  }
})
