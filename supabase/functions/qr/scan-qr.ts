import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScanQRResponse {
  batch: {
    id: string
    roast_date: string
    lot_number: string
    status: 'active' | 'archived'
    brewing_notes: string | null
    roaster_story: string | null
  }
  coffee: {
    id: string
    name: string
    variety: string | null
    processing_method: string | null
    producer_notes: string | null
    cover_image_url: string | null
    status: 'active' | 'archived'
  }
  origin: {
    country: string
    region: string | null
    farm: string | null
    altitude_min: number | null
    altitude_max: number | null
    producer: string | null
  }
  roaster: {
    id: string
    name: string
    city: string | null
    country: string | null
    logo_url: string | null
  }
  stats: {
    total_count: number
    avg_rating: number
    rating_distribution: Record<string, number>
    top_flavor_notes: Array<{
      id: string
      name: string
      label: string
      category: string
      count: number
    }>
  }
  archived?: boolean
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { hash } = await req.json()

    if (!hash) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'hash is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidUUID(hash)) {
      return new Response(
        JSON.stringify({ error: 'invalid_hash', message: 'hash must be a valid UUID v4' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: qrData, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        hash,
        batch_id,
        roast_batches!inner (
          id,
          roast_date,
          lot_number,
          status,
          brewing_notes,
          roaster_story,
          coffee_id,
          coffees!inner (
            id,
            name,
            variety,
            processing_method,
            producer_notes,
            cover_image_url,
            status,
            origin_id,
            roasters!inner (
              id,
              name,
              city,
              country,
              logo_url
            )
          )
        )
      `)
      .eq('hash', hash)
      .single()

    if (qrError || !qrData) {
      return new Response(
        JSON.stringify({ error: 'not_found', message: 'This QR code is not registered in funcup.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const batch = qrData.roast_batches
    const coffee = batch.coffees
    const roaster = coffee.roasters

    let origin = null
    if (coffee.origin_id) {
      const { data: originData } = await supabase
        .from('origins')
        .select('country, region, farm, altitude_min, altitude_max, producer')
        .eq('id', coffee.origin_id)
        .single()
      origin = originData
    }

    const { data: statsData } = await supabase
      .from('coffee_stats')
      .select('total_count, avg_rating, rating_distribution, top_flavor_notes')
      .eq('batch_id', batch.id)
      .single()

    let topFlavorNotes: Array<{ id: string; name: string; label: string; category: string; count: number }> = []
    
    if (statsData?.top_flavor_notes && statsData.top_flavor_notes.length > 0) {
      const flavorIds = statsData.top_flavor_notes.slice(0, 10)
      const { data: flavorData } = await supabase
        .from('tasting_notes')
        .select('id, name, label, category')
        .in('id', flavorIds)

      if (flavorData) {
        topFlavorNotes = flavorData.map(f => ({
          id: f.id,
          name: f.name,
          label: f.label,
          category: f.category,
          count: statsData.top_flavor_notes.filter((id: string) => id === f.id).length,
        }))
      }
    }

    const response: ScanQRResponse = {
      batch: {
        id: batch.id,
        roast_date: batch.roast_date,
        lot_number: batch.lot_number,
        status: batch.status as 'active' | 'archived',
        brewing_notes: batch.brewing_notes,
        roaster_story: batch.roaster_story,
      },
      coffee: {
        id: coffee.id,
        name: coffee.name,
        variety: coffee.variety,
        processing_method: coffee.processing_method,
        producer_notes: coffee.producer_notes,
        cover_image_url: coffee.cover_image_url,
        status: coffee.status as 'active' | 'archived',
      },
      origin: origin || {
        country: '',
        region: null,
        farm: null,
        altitude_min: null,
        altitude_max: null,
        producer: null,
      },
      roaster: {
        id: roaster.id,
        name: roaster.name,
        city: roaster.city,
        country: roaster.country,
        logo_url: roaster.logo_url,
      },
      stats: {
        total_count: statsData?.total_count || 0,
        avg_rating: statsData?.avg_rating || 0,
        rating_distribution: statsData?.rating_distribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        top_flavor_notes: topFlavorNotes,
      },
    }

    if (batch.status === 'archived') {
      response.archived = true
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})