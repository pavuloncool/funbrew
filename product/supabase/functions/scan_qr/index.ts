import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

async function loadCoffeeVarieties(
  supabase: ReturnType<typeof createClient>,
  coffeeId: string
) {
  const { data, error } = await supabase
    .from('coffee_variety_assignments')
    .select('coffee_varieties!inner(id, name, sort_order)')
    .eq('coffee_id', coffeeId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{
    coffee_varieties:
      | { id: string; name: string; sort_order: number }
      | Array<{ id: string; name: string; sort_order: number }>;
  }>)
    .map((row) =>
      Array.isArray(row.coffee_varieties)
        ? row.coffee_varieties[0] ?? null
        : row.coffee_varieties
    )
    .filter((entry): entry is { id: string; name: string; sort_order: number } => Boolean(entry))
    .sort((left, right) => left.sort_order - right.sort_order || left.name.localeCompare(right.name))
    .map(({ id, name }) => ({ id, name }));
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { hash } = await req.json();

    if (!hash) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'hash is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!isValidUUID(hash)) {
      return new Response(
        JSON.stringify({
          error: 'invalid_hash',
          message: 'hash must be a valid UUID',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: qrData, error: qrError } = await supabase
      .from('qr_codes')
      .select(
        `
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
            store_url,
            status,
            origin_id,
            roasters!inner (
              id,
              name,
              roaster_short_name,
              city,
              country,
              logo_url
            )
          )
        )
      `
      )
      .eq('hash', hash)
      .maybeSingle();

    if (!qrError && qrData) {
      const batch = qrData.roast_batches;
      const coffee = batch.coffees;
      const roaster = coffee.roasters;
      const varieties = await loadCoffeeVarieties(supabase, coffee.id);

      let origin = null;
      if (coffee.origin_id) {
        const { data: originData } = await supabase
          .from('origins')
          .select(
            'country, region, farm, altitude_min, altitude_max, producer'
          )
          .eq('id', coffee.origin_id)
          .single();
        origin = originData;
      }

      const { data: statsData } = await supabase
        .from('coffee_stats')
        .select('total_count, avg_rating, rating_distribution, top_flavor_notes')
        .eq('batch_id', batch.id)
        .single();

      let favoriteUserCount = 0;
      try {
        const { data: favoriteUserCountData, error: favoriteUserCountError } = await supabase.rpc(
          'get_coffee_favorite_user_count',
          { p_coffee_id: coffee.id }
        );
        if (!favoriteUserCountError) {
          favoriteUserCount = Number(favoriteUserCountData ?? 0);
        }
      } catch {
        favoriteUserCount = 0;
      }

      return new Response(
        JSON.stringify({
          kind: 'batch',
          batch: {
            id: batch.id,
            roast_date: batch.roast_date,
            lot_number: batch.lot_number,
            brewing_notes: batch.brewing_notes,
            roaster_story: batch.roaster_story,
          },
          coffee: {
            id: coffee.id,
            name: coffee.name,
            variety:
              varieties.length > 0
                ? varieties.map((entry) => entry.name).join(', ')
                : coffee.variety,
            varieties,
            processing_method: coffee.processing_method,
            producer_notes: coffee.producer_notes,
            cover_image_url: coffee.cover_image_url,
            store_url: coffee.store_url,
          },
          origin,
          roaster: {
            id: roaster.id,
            name: roaster.name,
            roaster_short_name: roaster.roaster_short_name,
            city: roaster.city,
            country: roaster.country,
            logo_url: roaster.logo_url,
          },
          stats: {
            total_count: statsData?.total_count || 0,
            avg_rating: statsData?.avg_rating || 0,
            favorite_user_count: favoriteUserCount,
            rating_distribution: statsData?.rating_distribution || {
              '1': 0,
              '2': 0,
              '3': 0,
              '4': 0,
              '5': 0,
            },
            top_flavor_notes: statsData?.top_flavor_notes || [],
          },
          archived: batch.status === 'archived',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'not_found',
        message: 'This QR code is not registered in funcup.',
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'server_error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
