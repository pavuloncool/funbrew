import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const coffeeId = url.searchParams.get('coffee_id')
    const batchId = url.searchParams.get('batch_id')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('coffees')
      .select(`
        id,
        name,
        variety,
        processing_method,
        producer_notes,
        cover_image_url,
        status,
        created_at,
        roaster:roasters!inner (
          id,
          name,
          city,
          country,
          logo_url
        ),
        origin:origins!inner (
          id,
          country,
          region,
          farm,
          altitude_min,
          altitude_max,
          producer
        )
      `)
      .eq('status', 'active')

    if (coffeeId) {
      query = query.eq('id', coffeeId)
    }

    const { data: coffees, error } = await query

    if (error) {
      return new Response(
        JSON.stringify({ error: 'fetch_failed', message: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let batches: Record<string, unknown>[] = []
    
    if (coffeeId && !batchId) {
      const { data: batchData } = await supabase
        .from('roast_batches')
        .select(`
          id,
          roast_date,
          lot_number,
          status,
          brewing_notes,
          roaster_story,
          coffee_stats (
            total_count,
            avg_rating
          )
        `)
        .eq('coffee_id', coffeeId)
        .eq('status', 'active')
        .order('roast_date', { ascending: false })

      batches = batchData || []
    } else if (batchId) {
      const { data: batchData } = await supabase
        .from('roast_batches')
        .select(`
          id,
          roast_date,
          lot_number,
          status,
          brewing_notes,
          roaster_story,
          coffee_stats (
            total_count,
            avg_rating,
            rating_distribution,
            top_flavor_notes
          )
        `)
        .eq('id', batchId)
        .single()

      if (batchData) {
        batches = [batchData]
      }
    }

    return new Response(
      JSON.stringify({ coffees, batches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})