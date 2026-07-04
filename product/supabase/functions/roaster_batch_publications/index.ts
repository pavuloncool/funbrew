import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type CoffeeVarietyRow = {
  id: string
  name: string
  sort_order: number
}

type CoffeeRow = {
  id: string
  name: string
  variety: string | null
  processing_method: string | null
  producer_notes: string | null
  cover_image_url: string | null
  store_url: string | null
  origin_id: string | null
}

function json(status: number, body: Record<string, unknown> | unknown[]) {
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

function formatVarietyLabel(varieties: Array<{ name: string }>, fallback: string | null): string | null {
  if (varieties.length > 0) {
    return varieties.map((entry) => entry.name).join(', ')
  }
  return fallback
}

async function loadCoffeeVarieties(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  coffeeIds: string[]
): Promise<Map<string, Array<{ id: string; name: string }>>> {
  const empty = new Map<string, Array<{ id: string; name: string }>>()
  if (!admin || coffeeIds.length === 0) return empty

  const assignmentsResult = await admin
    .from('coffee_variety_assignments')
    .select('coffee_id, coffee_varieties!inner(id, name, sort_order)')
    .in('coffee_id', coffeeIds)

  if (assignmentsResult.error) {
    throw new Error(assignmentsResult.error.message)
  }

  const byCoffeeId = new Map<string, Array<{ id: string; name: string; sortOrder: number }>>()
  for (const row of (assignmentsResult.data ?? []) as Array<{
    coffee_id: string
    coffee_varieties:
      | { id: string; name: string; sort_order: number }
      | Array<{ id: string; name: string; sort_order: number }>
  }>) {
    const related = Array.isArray(row.coffee_varieties)
      ? row.coffee_varieties[0] ?? null
      : row.coffee_varieties
    if (!related) continue

    const bucket = byCoffeeId.get(row.coffee_id) ?? []
    bucket.push({
      id: related.id,
      name: related.name,
      sortOrder: related.sort_order,
    })
    byCoffeeId.set(row.coffee_id, bucket)
  }

  const normalized = new Map<string, Array<{ id: string; name: string }>>()
  for (const [coffeeId, bucket] of byCoffeeId.entries()) {
    normalized.set(
      coffeeId,
      bucket
        .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
        .map(({ id, name }) => ({ id, name }))
    )
  }

  return normalized
}

async function listVarieties(
  admin: Awaited<ReturnType<typeof createAdminClient>>
) {
  if (!admin) {
    return json(500, { error: 'server_error', message: 'Supabase env is not configured.' })
  }

  const varietiesResult = await admin
    .from('coffee_varieties')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true })

  if (varietiesResult.error) {
    return json(500, { error: 'server_error', message: varietiesResult.error.message })
  }

  return json(
    200,
    ((varietiesResult.data ?? []) as CoffeeVarietyRow[]).map((row) => ({
      id: row.id,
      name: row.name,
    }))
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const auth = await requireRoaster(req)
    if ('error' in auth) return auth.error

    const body = asRecord(await req.json().catch(() => null))
    const mode = typeof body?.mode === 'string' ? body.mode : null

    if (mode !== 'list' && mode !== 'detail' && mode !== 'varieties') {
      return json(400, { error: 'bad_request', message: 'Mode must be list, detail or varieties.' })
    }

    const admin = auth.admin
    if (mode === 'varieties') {
      return await listVarieties(admin)
    }

    const roasterId = auth.roaster.id

    const coffeesResult = await admin
      .from('coffees')
      .select('id, name, variety, processing_method, producer_notes, cover_image_url, store_url, origin_id')
      .eq('roaster_id', roasterId)
      .order('created_at', { ascending: false })

    if (coffeesResult.error) {
      return json(500, { error: 'server_error', message: coffeesResult.error.message })
    }

    const coffees = (coffeesResult.data ?? []) as CoffeeRow[]

    if (coffees.length === 0) {
      return json(200, mode === 'list' ? [] : { error: 'not_found', message: 'Batch not found.' })
    }

    const coffeeById = new Map(coffees.map((coffee) => [coffee.id, coffee]))
    const coffeeIds = coffees.map((coffee) => coffee.id)
    const coffeeVarietiesByCoffeeId = await loadCoffeeVarieties(admin, coffeeIds)

    if (mode === 'list') {
      const batchesResult = await admin
        .from('roast_batches')
        .select('*')
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
        declared_sensory_acidity: number | null
        declared_sensory_sweetness: number | null
        declared_sensory_body?: number | null
        declared_sensory_bitter?: number | null
        declared_sensory_aftertaste?: number | null
        suggested_brew_method_ids: string[] | null
        suggested_tasting_note_ids: string[] | null
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
        const coffeeVarieties = coffeeVarietiesByCoffeeId.get(coffee.id) ?? []
        return [{
          batchId: batch.id,
          coffeeId: coffee.id,
          coffeeName: coffee.name,
          coverImageUrl: coffee.cover_image_url,
          storeUrl: coffee.store_url,
          coffeeVariety: formatVarietyLabel(coffeeVarieties, coffee.variety),
          coffeeVarieties,
          coffeeProcessingMethod: coffee.processing_method,
          lotNumber: batch.lot_number,
          roastDate: batch.roast_date,
          declaredSensoryAcidity: batch.declared_sensory_acidity,
          declaredSensorySweetness: batch.declared_sensory_sweetness,
          declaredSensoryBody: batch.declared_sensory_body,
          declaredSensoryBitter: batch.declared_sensory_bitter ?? null,
          declaredSensoryAftertaste: batch.declared_sensory_aftertaste ?? null,
          suggestedBrewMethodIds: batch.suggested_brew_method_ids ?? [],
          suggestedTastingNoteIds: batch.suggested_tasting_note_ids ?? [],
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
      .select('*')
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
      declared_sensory_acidity: number | null
      declared_sensory_sweetness: number | null
      declared_sensory_body?: number | null
      declared_sensory_bitter?: number | null
      declared_sensory_aftertaste?: number | null
      suggested_brew_method_ids: string[] | null
      suggested_tasting_note_ids: string[] | null
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

    const favoriteUsersCountPromise = admin
      .rpc('get_coffee_favorite_user_count', { p_coffee_id: coffee.id })
      .then(({ data, error }) => {
        if (error) return 0
        return Number(data ?? 0)
      })
      .catch(() => 0)

    const [qrResult, statsResult, favoriteUsersCount] = await Promise.all([
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
      favoriteUsersCountPromise,
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

    const coffeeVarieties = coffeeVarietiesByCoffeeId.get(coffee.id) ?? []
    const statsRow = statsResult.data as { total_count: number; avg_rating: number; updated_at: string | null } | null

    return json(200, {
      coffee: {
        id: coffee.id,
        name: coffee.name,
        variety: formatVarietyLabel(coffeeVarieties, coffee.variety),
        varieties: coffeeVarieties,
        processingMethod: coffee.processing_method,
        producerNotes: coffee.producer_notes,
        coverImageUrl: coffee.cover_image_url,
        storeUrl: coffee.store_url,
      },
      origin,
      batch: {
        id: batch.id,
        lotNumber: batch.lot_number,
        roastDate: batch.roast_date,
        brewingNotes: batch.brewing_notes,
        roasterStory: batch.roaster_story,
        declaredSensoryAcidity: batch.declared_sensory_acidity,
        declaredSensorySweetness: batch.declared_sensory_sweetness,
        declaredSensoryBody: batch.declared_sensory_body,
        declaredSensoryBitter: batch.declared_sensory_bitter ?? null,
        declaredSensoryAftertaste: batch.declared_sensory_aftertaste ?? null,
        suggestedBrewMethodIds: batch.suggested_brew_method_ids ?? [],
        suggestedTastingNoteIds: batch.suggested_tasting_note_ids ?? [],
        createdAt: batch.created_at,
      },
      qr,
      stats: {
        totalCount: statsRow?.total_count ?? 0,
        avgRating: Number(statsRow?.avg_rating ?? 0),
        favoriteUsersCount,
        updatedAt: statsRow?.updated_at ?? null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return json(500, { error: 'server_error', message })
  }
})
