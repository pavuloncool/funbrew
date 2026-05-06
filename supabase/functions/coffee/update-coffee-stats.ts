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

    const { batch_id, user_id } = await req.json()

    if (!batch_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'invalid_input', message: 'batch_id and user_id are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: logsData } = await supabase
      .from('coffee_logs')
      .select('rating')
      .eq('batch_id', batch_id)

    const totalCount = logsData?.length || 0
    const avgRating = totalCount > 0 
      ? Number((logsData!.reduce((sum, l) => sum + l.rating, 0) / totalCount).toFixed(2))
      : 0

    const ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    if (logsData) {
      for (const log of logsData) {
        const r = String(log.rating) as '1' | '2' | '3' | '4' | '5'
        if (ratingDistribution[r] !== undefined) {
          ratingDistribution[r]++
        }
      }
    }

    const { data: logIdsData } = await supabase
      .from('coffee_logs')
      .select('id')
      .eq('batch_id', batch_id)

    const logIds = (logIdsData ?? []).map((row) => row.id)

    const { data: flavorData } = logIds.length
      ? await supabase
          .from('coffee_log_tasting_notes')
          .select(`
            tasting_notes!inner (id, name, label, category)
          `)
          .in('coffee_log_id', logIds)
      : { data: [] }

    const flavorCounts: Record<string, { id: string; name: string; label: string; category: string; count: number }> = {}
    if (flavorData) {
      for (const item of flavorData) {
        const fn = item.tasting_notes
        if (fn && fn.id) {
          if (!flavorCounts[fn.id]) {
            flavorCounts[fn.id] = { id: fn.id, name: fn.name, label: fn.label, category: fn.category, count: 0 }
          }
          flavorCounts[fn.id].count++
        }
      }
    }

    const topFlavorNotes = Object.values(flavorCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const { error: upsertError } = await supabase
      .from('coffee_stats')
      .upsert({
        batch_id,
        total_count: totalCount,
        avg_rating: avgRating,
        rating_distribution: ratingDistribution,
        top_flavor_notes: topFlavorNotes.map(f => f.id),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'batch_id' })

    if (upsertError) {
      return new Response(
        JSON.stringify({ error: 'aggregation_failed', message: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const reputationResult = await recalculateUserReputation(supabase, user_id)

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
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'aggregation_failed', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function recalculateUserReputation(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: userLogs } = await supabase
    .from('coffee_logs')
    .select('id, rating')
    .eq('user_id', userId)

  const logCount = userLogs?.length || 0
  
    const { data: user } = await supabase
      .from('users')
      .select('sensory_level,sensory_score')
      .eq('id', userId)
      .single()

  const currentLevel = user?.sensory_level || 'beginner'
  const currentScore = typeof user?.sensory_score === 'number' ? user.sensory_score : 0
  let newLevel = currentLevel
  const newScore = logCount

  if (logCount >= 50 && currentLevel !== 'expert') {
    newLevel = 'expert'
  } else if (logCount >= 20 && currentLevel === 'beginner') {
    newLevel = 'advanced'
  }

  if (newLevel !== currentLevel || newScore !== currentScore) {
    await supabase
      .from('users')
      .update({ sensory_level: newLevel, sensory_score: newScore })
      .eq('id', userId)
  }

  return {
    updated: newLevel !== currentLevel || newScore !== currentScore,
    newLevel: newLevel !== currentLevel ? newLevel : null,
    newScore,
  }
}
