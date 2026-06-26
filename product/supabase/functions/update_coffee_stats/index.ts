import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batch_id, user_id } = await req.json();

    if (!batch_id || !user_id) {
      return new Response(
        JSON.stringify({
          error: 'invalid_input',
          message: 'batch_id and user_id are required.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: logsData } = await supabase
      .from('coffee_logs')
      .select('rating')
      .eq('batch_id', batch_id);

    const totalCount = logsData?.length || 0;
    const avgRating =
      totalCount > 0
        ? Number(
            (
              logsData!.reduce((sum: number, l: { rating: number }) => sum + l.rating, 0) /
              totalCount
            ).toFixed(2)
          )
        : 0;

    const ratingDistribution: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    if (logsData) {
      for (const log of logsData) {
        const r = String(log.rating);
        if (ratingDistribution[r] !== undefined) ratingDistribution[r]++;
      }
    }

    const { data: logIdsData } = await supabase
      .from('coffee_logs')
      .select('id')
      .eq('batch_id', batch_id);

    const logIds = (logIdsData ?? []).map((row) => row.id);

    const { data: flavorData } = logIds.length
      ? await supabase
          .from('coffee_log_tasting_notes')
          .select(`tasting_notes!inner (id, name, label, category)`)
          .in('coffee_log_id', logIds)
      : { data: [] };

    type FlavorNoteRow = {
      tasting_notes: { id: string; name: string; label: string; category: string } | null;
    };

    const flavorCounts: Record<
      string,
      { id: string; name: string; label: string; category: string; count: number }
    > = {};
    if (flavorData) {
      for (const item of flavorData as FlavorNoteRow[]) {
        const fn = item.tasting_notes;
        if (fn?.id) {
          if (!flavorCounts[fn.id]) {
            flavorCounts[fn.id] = {
              id: fn.id,
              name: fn.name,
              label: fn.label,
              category: fn.category,
              count: 0,
            };
          }
          flavorCounts[fn.id].count++;
        }
      }
    }

    const topFlavorNotes = Object.values(flavorCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const { error: upsertError } = await supabase
      .from('coffee_stats')
      .upsert(
        {
          batch_id,
          total_count: totalCount,
          avg_rating: avgRating,
          rating_distribution: ratingDistribution,
          top_flavor_notes: topFlavorNotes.map(f => f.id),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'batch_id' }
      );

    if (upsertError) {
      return new Response(
        JSON.stringify({ error: 'aggregation_failed', message: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reputationResult = await recalculateUserReputation(supabase, user_id);

    return new Response(
      JSON.stringify({
        updated: true,
        batch_id,
        stats: {
          total_count: totalCount,
          avg_rating: avgRating,
          rating_distribution: ratingDistribution,
          top_flavor_notes: topFlavorNotes,
          updated_at: new Date().toISOString(),
        },
        reputation_updated: reputationResult.updated,
        new_sensory_level: reputationResult.newLevel,
        new_sensory_score: reputationResult.newScore,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'aggregation_failed', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function recalculateUserReputation(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data: currentUser } = await supabase
    .from('users')
    .select('sensory_level,sensory_score')
    .eq('id', userId)
    .single();

  const currentLevel = currentUser?.sensory_level || 'beginner';
  const currentScore = typeof currentUser?.sensory_score === 'number' ? currentUser.sensory_score : 0;

  const { error: recalculateError } = await supabase.rpc('recalculate_user_reputation', {
    p_user_id: userId,
  });

  if (recalculateError) {
    throw new Error(recalculateError.message);
  }

  const { data: updatedUser } = await supabase
    .from('users')
    .select('sensory_level,sensory_score')
    .eq('id', userId)
    .single();

  const nextLevel = updatedUser?.sensory_level || currentLevel;
  const nextScore = typeof updatedUser?.sensory_score === 'number' ? updatedUser.sensory_score : currentScore;

  return {
    updated: nextLevel !== currentLevel || nextScore !== currentScore,
    newLevel: nextLevel !== currentLevel ? nextLevel : null,
    newScore: nextScore,
  };
}
