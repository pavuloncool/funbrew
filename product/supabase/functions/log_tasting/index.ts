import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type LogTastingRequest = {
  batch_id: string;
  rating: number;
  brew_method_id?: string;
  brew_time_seconds?: number;
  tasting_note_ids?: string[];
  flavor_note_ids?: string[];
  free_text_notes?: string;
  review?: string;
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { flowType: 'pkce' },
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Valid session required.',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Valid session required.',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await req.json()) as LogTastingRequest;
    const {
      batch_id,
      rating,
      brew_method_id,
      brew_time_seconds,
      tasting_note_ids,
      flavor_note_ids,
      free_text_notes,
      review,
    } = body;
    const selectedTastingNoteIds = tasting_note_ids ?? flavor_note_ids ?? [];

    if (!batch_id || !rating) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'batch_id and rating are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({
          error: 'bad_request',
          message: 'rating must be between 1 and 5',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const serviceSupabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: coffeeLog, error: logError } = await serviceSupabase
      .from('coffee_logs')
      .insert({
        user_id: user.id,
        batch_id,
        rating,
        brew_method_id,
        brew_time_seconds,
        free_text_notes,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      return new Response(
        JSON.stringify({ error: 'insert_failed', message: logError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (selectedTastingNoteIds.length > 0) {
      const tastingNotes = selectedTastingNoteIds.map(tasting_note_id => ({
        coffee_log_id: coffeeLog.id,
        tasting_note_id,
      }));

      const { error: notesError } = await serviceSupabase
        .from('coffee_log_tasting_notes')
        .insert(tastingNotes);

      if (notesError) {
        console.error('Failed to insert tasting notes:', notesError.message);
      }
    }

    if (review && review.trim()) {
      const { error: reviewError } = await serviceSupabase.from('reviews').insert({
        coffee_log_id: coffeeLog.id,
        body: review.trim(),
      });

      if (reviewError) {
        // Fail hard for Optional review durability: do not report success if review cannot persist.
        await serviceSupabase
          .from('coffee_logs')
          .delete()
          .eq('id', coffeeLog.id);
        return new Response(
          JSON.stringify({ error: 'review_insert_failed', message: reviewError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        coffee_log_id: coffeeLog.id,
        message: 'Tasting logged successfully',
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.';
    return new Response(
      JSON.stringify({ error: 'server_error', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
