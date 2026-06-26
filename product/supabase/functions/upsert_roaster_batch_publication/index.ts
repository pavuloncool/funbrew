import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type VarietyOptionRow = {
  id: string
  name: string
  sort_order: number
}

type IdRow = {
  id: string
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

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asNullableScore(value: unknown): number | null {
  const parsed = asNullableNumber(value)
  if (parsed == null) return null
  const rounded = Math.round(parsed)
  if (rounded < 1 || rounded > 5) {
    throw new Error('Declared sensory scores must be between 1 and 5.')
  }
  return rounded
}

function asNullableHttpUrl(value: unknown): string | null {
  const url = asNullableString(value)
  if (!url) return null

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Store URL must be a valid absolute http:// or https:// URL.')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Store URL must be a valid absolute http:// or https:// URL.')
  }

  return url
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .filter((entry) => {
      if (seen.has(entry)) return false
      seen.add(entry)
      return true
    })
}

function isMissingColumnError(error: { message?: string } | null | undefined, column: string): boolean {
  if (!error?.message) return false
  return error.message.includes(column)
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
    .select('id')
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
    roasterId: (roasterResult.data as { id: string }).id,
  }
}

function parseOrigin(record: Record<string, unknown> | null) {
  if (!record) return null
  const payload = {
    country: asNullableString(record.country),
    region: asNullableString(record.region),
    farm: asNullableString(record.farm),
    producer: asNullableString(record.producer),
    altitude_min: asNullableNumber(record.altitudeMin),
    altitude_max: asNullableNumber(record.altitudeMax),
  }

  const hasValue = Object.values(payload).some((value) => value !== null)
  if (!hasValue) return null
  if (!payload.country) throw new Error('Origin country is required when origin details are provided.')
  return payload
}

async function resolveVarieties(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  varietyIds: string[]
): Promise<Array<{ id: string; name: string }>> {
  if (!admin || varietyIds.length === 0) return []

  const uniqueIds = [...new Set(varietyIds)]
  const result = await admin
    .from('coffee_varieties')
    .select('id, name, sort_order')
    .in('id', uniqueIds)
    .order('sort_order', { ascending: true })

  if (result.error) {
    throw new Error(result.error.message)
  }

  const rows = (result.data ?? []) as VarietyOptionRow[]
  if (rows.length !== uniqueIds.length) {
    throw new Error('All selected varieties must exist in the catalog.')
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }))
}

async function resolveCatalogIds(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  table: 'brew_methods' | 'tasting_notes',
  ids: string[]
): Promise<string[]> {
  if (!admin || ids.length === 0) return []

  const uniqueIds = [...new Set(ids)]
  const result = await admin
    .from(table)
    .select('id')
    .in('id', uniqueIds)

  if (result.error) {
    throw new Error(result.error.message)
  }

  const rows = (result.data ?? []) as IdRow[]
  if (rows.length !== uniqueIds.length) {
    throw new Error(`All selected ${table} entries must exist in the catalog.`)
  }

  const resolvedIds = new Set(rows.map((row) => row.id))
  return uniqueIds.filter((id) => resolvedIds.has(id))
}

async function replaceVarietyAssignments(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  coffeeId: string,
  varietyIds: string[]
) {
  if (!admin) return

  const deleteResult = await admin
    .from('coffee_variety_assignments')
    .delete()
    .eq('coffee_id', coffeeId)

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message)
  }

  if (varietyIds.length === 0) return

  const insertResult = await admin
    .from('coffee_variety_assignments')
    .insert(varietyIds.map((varietyId) => ({
      coffee_id: coffeeId,
      variety_id: varietyId,
    })))

  if (insertResult.error) {
    throw new Error(insertResult.error.message)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const auth = await requireRoaster(req)
    if ('error' in auth) return auth.error

    const body = asRecord(await req.json().catch(() => null))
    if (!body) {
      return json(400, { error: 'bad_request', message: 'Body is required.' })
    }

    const mode = body.mode
    if (mode !== 'create' && mode !== 'update') {
      return json(400, { error: 'bad_request', message: 'Mode must be create or update.' })
    }

    const coffeeInput = asRecord(body.coffee)
    const batchInput = asRecord(body.batch)
    if (!coffeeInput || !batchInput) {
      return json(400, { error: 'bad_request', message: 'Coffee and batch payloads are required.' })
    }

    const coffeeName = asNullableString(coffeeInput.name)
    const lotNumber = asNullableString(batchInput.lotNumber)
    const roastDate = asNullableString(batchInput.roastDate)
    if (!coffeeName) {
      return json(400, { error: 'bad_request', message: 'Coffee name is required.' })
    }
    if (!lotNumber) {
      return json(400, { error: 'bad_request', message: 'Lot number is required.' })
    }
    if (!roastDate) {
      return json(400, { error: 'bad_request', message: 'Roast date is required.' })
    }

    const admin = auth.admin
    const roasterId = auth.roasterId
    const originPayload = parseOrigin(asRecord(body.origin))
    const resolvedVarieties = await resolveVarieties(admin, asStringArray(coffeeInput.varietyIds))
    const suggestedBrewMethodIds = await resolveCatalogIds(
      admin,
      'brew_methods',
      asStringArray(batchInput.suggestedBrewMethodIds)
    )
    const suggestedTastingNoteIds = await resolveCatalogIds(
      admin,
      'tasting_notes',
      asStringArray(batchInput.suggestedTastingNoteIds)
    )
    const declaredSensoryAcidity = asNullableScore(batchInput.declaredSensoryAcidity)
    const declaredSensorySweetness = asNullableScore(batchInput.declaredSensorySweetness)
    const declaredSensoryBody = asNullableScore(batchInput.declaredSensoryBody)
    const declaredSensoryBitter = asNullableScore(batchInput.declaredSensoryBitter)
    const declaredSensoryAftertaste = asNullableScore(batchInput.declaredSensoryAftertaste)
    const varietyLabel = resolvedVarieties.length > 0
      ? resolvedVarieties.map((entry) => entry.name).join(', ')
      : null

    let originId: string | null = null
    let coffeeId: string
    let batchId: string

    if (mode === 'create') {
      if (originPayload) {
        const createOrigin = await admin.from('origins').insert(originPayload).select('id').single()
        if (createOrigin.error || !createOrigin.data) {
          return json(500, { error: 'server_error', message: createOrigin.error?.message ?? 'Unable to create origin.' })
        }
        originId = (createOrigin.data as { id: string }).id
      }

      const createCoffee = await admin
        .from('coffees')
        .insert({
          roaster_id: roasterId,
          origin_id: originId,
          name: coffeeName,
          variety: varietyLabel,
          processing_method: asNullableString(coffeeInput.processingMethod),
          producer_notes: asNullableString(coffeeInput.producerNotes),
          cover_image_url: asNullableString(coffeeInput.coverImageUrl),
          store_url: asNullableHttpUrl(coffeeInput.storeUrl),
          status: 'active',
        })
        .select('id')
        .single()

      if (createCoffee.error || !createCoffee.data) {
        return json(500, { error: 'server_error', message: createCoffee.error?.message ?? 'Unable to create coffee.' })
      }

      coffeeId = (createCoffee.data as { id: string }).id
      await replaceVarietyAssignments(admin, coffeeId, resolvedVarieties.map((entry) => entry.id))

      const createBatchPayload = {
        coffee_id: coffeeId,
        lot_number: lotNumber,
        roast_date: roastDate,
        brewing_notes: asNullableString(batchInput.brewingNotes),
        roaster_story: asNullableString(batchInput.roasterStory),
        declared_sensory_acidity: declaredSensoryAcidity,
        declared_sensory_sweetness: declaredSensorySweetness,
        declared_sensory_body: declaredSensoryBody,
        declared_sensory_bitter: declaredSensoryBitter,
        declared_sensory_aftertaste: declaredSensoryAftertaste,
        suggested_brew_method_ids: suggestedBrewMethodIds,
        suggested_tasting_note_ids: suggestedTastingNoteIds,
        status: 'active',
      }

      let createBatch = await admin
        .from('roast_batches')
        .insert(createBatchPayload)
        .select('id')
        .single()

      if (
        createBatch.error &&
        (
          isMissingColumnError(createBatch.error, 'declared_sensory_body') ||
          isMissingColumnError(createBatch.error, 'declared_sensory_bitter') ||
          isMissingColumnError(createBatch.error, 'declared_sensory_aftertaste')
        )
      ) {
        const {
          declared_sensory_body: _declaredSensoryBody,
          declared_sensory_bitter: _declaredSensoryBitter,
          declared_sensory_aftertaste: _declaredSensoryAftertaste,
          ...legacyCreateBatchPayload
        } = createBatchPayload
        createBatch = await admin
          .from('roast_batches')
          .insert(legacyCreateBatchPayload)
          .select('id')
          .single()
      }

      if (createBatch.error || !createBatch.data) {
        return json(500, { error: 'server_error', message: createBatch.error?.message ?? 'Unable to create batch.' })
      }

      batchId = (createBatch.data as { id: string }).id
      return json(200, { created: true, batchId, coffeeId, originId })
    }

    const requestedBatchId = asNullableString(body.batchId)
    if (!requestedBatchId) {
      return json(400, { error: 'bad_request', message: 'batchId is required for update mode.' })
    }

    const batchResult = await admin
      .from('roast_batches')
      .select('id, coffee_id')
      .eq('id', requestedBatchId)
      .maybeSingle()

    if (batchResult.error) {
      return json(500, { error: 'server_error', message: batchResult.error.message })
    }
    if (!batchResult.data) {
      return json(404, { error: 'not_found', message: 'Batch not found.' })
    }

    const batchRow = batchResult.data as { id: string; coffee_id: string }
    const coffeeResult = await admin
      .from('coffees')
      .select('id, roaster_id, origin_id')
      .eq('id', batchRow.coffee_id)
      .maybeSingle()

    if (coffeeResult.error) {
      return json(500, { error: 'server_error', message: coffeeResult.error.message })
    }
    if (!coffeeResult.data) {
      return json(404, { error: 'not_found', message: 'Coffee not found for this batch.' })
    }

    const coffeeRow = coffeeResult.data as { id: string; roaster_id: string; origin_id: string | null }
    if (coffeeRow.roaster_id !== roasterId) {
      return json(403, { error: 'forbidden', message: 'This batch does not belong to your roastery.' })
    }

    coffeeId = coffeeRow.id
    batchId = batchRow.id
    originId = coffeeRow.origin_id

    if (originPayload && originId) {
      const updateOrigin = await admin.from('origins').update(originPayload).eq('id', originId).select('id').single()
      if (updateOrigin.error || !updateOrigin.data) {
        return json(500, { error: 'server_error', message: updateOrigin.error?.message ?? 'Unable to update origin.' })
      }
    } else if (originPayload && !originId) {
      const createOrigin = await admin.from('origins').insert(originPayload).select('id').single()
      if (createOrigin.error || !createOrigin.data) {
        return json(500, { error: 'server_error', message: createOrigin.error?.message ?? 'Unable to create origin.' })
      }
      originId = (createOrigin.data as { id: string }).id
    } else if (!originPayload) {
      originId = null
    }

    const updateCoffee = await admin
      .from('coffees')
      .update({
        origin_id: originId,
        name: coffeeName,
        variety: varietyLabel,
        processing_method: asNullableString(coffeeInput.processingMethod),
        producer_notes: asNullableString(coffeeInput.producerNotes),
        cover_image_url: asNullableString(coffeeInput.coverImageUrl),
        store_url: asNullableHttpUrl(coffeeInput.storeUrl),
        status: 'active',
      })
      .eq('id', coffeeId)
      .eq('roaster_id', roasterId)
      .select('id')
      .single()

    if (updateCoffee.error || !updateCoffee.data) {
      return json(500, { error: 'server_error', message: updateCoffee.error?.message ?? 'Unable to update coffee.' })
    }

    await replaceVarietyAssignments(admin, coffeeId, resolvedVarieties.map((entry) => entry.id))

    const updateBatchPayload = {
      lot_number: lotNumber,
      roast_date: roastDate,
      brewing_notes: asNullableString(batchInput.brewingNotes),
      roaster_story: asNullableString(batchInput.roasterStory),
      declared_sensory_acidity: declaredSensoryAcidity,
      declared_sensory_sweetness: declaredSensorySweetness,
      declared_sensory_body: declaredSensoryBody,
      declared_sensory_bitter: declaredSensoryBitter,
      declared_sensory_aftertaste: declaredSensoryAftertaste,
      suggested_brew_method_ids: suggestedBrewMethodIds,
      suggested_tasting_note_ids: suggestedTastingNoteIds,
      status: 'active',
    }

    let updateBatch = await admin
      .from('roast_batches')
      .update(updateBatchPayload)
      .eq('id', batchId)
      .eq('coffee_id', coffeeId)
      .select('id')
      .single()

    if (
      updateBatch.error &&
      (
        isMissingColumnError(updateBatch.error, 'declared_sensory_body') ||
        isMissingColumnError(updateBatch.error, 'declared_sensory_bitter') ||
        isMissingColumnError(updateBatch.error, 'declared_sensory_aftertaste')
      )
    ) {
      const {
        declared_sensory_body: _declaredSensoryBody,
        declared_sensory_bitter: _declaredSensoryBitter,
        declared_sensory_aftertaste: _declaredSensoryAftertaste,
        ...legacyUpdateBatchPayload
      } = updateBatchPayload
      updateBatch = await admin
        .from('roast_batches')
        .update(legacyUpdateBatchPayload)
        .eq('id', batchId)
        .eq('coffee_id', coffeeId)
        .select('id')
        .single()
    }

    if (updateBatch.error || !updateBatch.data) {
      return json(500, { error: 'server_error', message: updateBatch.error?.message ?? 'Unable to update batch.' })
    }

    return json(200, { created: false, batchId, coffeeId, originId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return json(500, { error: 'server_error', message })
  }
})
