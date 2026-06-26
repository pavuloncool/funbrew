import type { TypedSupabaseClient } from '../services/supabaseClientFactory';
import { resolveSensoryReputation } from '../constants/reputation';
import {
  isRoasterExperienceLevel,
  normalizeRoasterTelemetryCoreInput,
  type RoasterExperienceLevel,
  type RoasterTelemetryCoreInput,
  type RoasterTelemetryCoreRecord,
} from './telemetryCore';

type TelemetryRow = {
  coffee_log_id: string;
  brew_method_id: string;
  overall_rating: number;
  sensory_acidity: number;
  sensory_sweetness: number;
  sensory_body: number;
  sensory_bitter: number | null;
  sensory_aftertaste: number | null;
  repurchase_intent: 'yes' | 'no' | 'unsure';
  experience_level: RoasterExperienceLevel;
  created_at: string;
  updated_at: string;
};

function mapTelemetryRow(row: TelemetryRow): RoasterTelemetryCoreRecord {
  return {
    coffeeLogId: row.coffee_log_id,
    brewMethodId: row.brew_method_id,
    overallRating: row.overall_rating,
    sensoryAcidity: row.sensory_acidity,
    sensorySweetness: row.sensory_sweetness,
    sensoryBody: row.sensory_body,
    sensoryBitter: row.sensory_bitter ?? 3,
    sensoryAftertaste: row.sensory_aftertaste ?? 3,
    repurchaseIntent: row.repurchase_intent,
    experienceLevel: row.experience_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveExperienceLevel(params: {
  supabase: TypedSupabaseClient;
  userId: string;
  fallback: RoasterExperienceLevel;
}): Promise<RoasterExperienceLevel> {
  const { data, error } = await params.supabase
    .from('users')
    .select('sensory_score,sensory_level,sensory_level_override')
    .eq('id', params.userId)
    .maybeSingle();

  if (error) return params.fallback;

  const reputation = resolveSensoryReputation({
    sensoryScore: (data as { sensory_score?: unknown } | null)?.sensory_score,
    sensoryLevel: (data as { sensory_level?: unknown } | null)?.sensory_level,
    sensoryLevelOverride: (data as { sensory_level_override?: unknown } | null)?.sensory_level_override,
  });
  return isRoasterExperienceLevel(reputation.effectiveLevel) ? reputation.effectiveLevel : params.fallback;
}

export async function upsertRoasterTelemetryCore(params: {
  supabase: TypedSupabaseClient;
  coffeeLogId: string;
  userId: string;
  input: RoasterTelemetryCoreInput;
}): Promise<RoasterTelemetryCoreRecord> {
  const normalized = normalizeRoasterTelemetryCoreInput(params.input);
  const experienceLevel = await resolveExperienceLevel({
    supabase: params.supabase,
    userId: params.userId,
    fallback: normalized.experienceLevel,
  });

  const payload = {
    coffee_log_id: params.coffeeLogId,
    brew_method_id: normalized.brewMethodId,
    overall_rating: normalized.overallRating,
    sensory_acidity: normalized.sensoryAcidity,
    sensory_sweetness: normalized.sensorySweetness,
    sensory_body: normalized.sensoryBody,
    sensory_bitter: normalized.sensoryBitter,
    sensory_aftertaste: normalized.sensoryAftertaste,
    repurchase_intent: normalized.repurchaseIntent,
    experience_level: experienceLevel,
  };

  const telemetryTable = params.supabase.from('coffee_log_telemetry_core') as unknown as {
    upsert: (
      value: Omit<TelemetryRow, 'created_at' | 'updated_at'>,
      options: { onConflict: string }
    ) => {
      select: (columns: string) => {
        maybeSingle: () => Promise<{ data: TelemetryRow | null; error: Error | null }>;
      };
    };
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: TelemetryRow | null; error: Error | null }>;
      };
    };
  };

  const { data, error } = await telemetryTable
    .upsert(payload, { onConflict: 'coffee_log_id' })
    .select(
      'coffee_log_id,brew_method_id,overall_rating,sensory_acidity,sensory_sweetness,sensory_body,sensory_bitter,sensory_aftertaste,repurchase_intent,experience_level,created_at,updated_at'
    )
    .maybeSingle();

  if (error) throw error;
  if (data) return mapTelemetryRow(data as TelemetryRow);

  const { data: fallbackData, error: fallbackError } = await telemetryTable
    .select(
      'coffee_log_id,brew_method_id,overall_rating,sensory_acidity,sensory_sweetness,sensory_body,sensory_bitter,sensory_aftertaste,repurchase_intent,experience_level,created_at,updated_at'
    )
    .eq('coffee_log_id', params.coffeeLogId)
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  if (!fallbackData) {
    throw new Error('Telemetry row was not returned after save.');
  }
  return mapTelemetryRow(fallbackData as TelemetryRow);
}

export async function fetchRoasterTelemetryCore(
  supabase: TypedSupabaseClient,
  coffeeLogId: string
): Promise<RoasterTelemetryCoreRecord | null> {
  const telemetryTable = supabase.from('coffee_log_telemetry_core') as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: TelemetryRow | null; error: Error | null }>;
      };
    };
  };

  const { data, error } = await telemetryTable
    .select(
      'coffee_log_id,brew_method_id,overall_rating,sensory_acidity,sensory_sweetness,sensory_body,sensory_bitter,sensory_aftertaste,repurchase_intent,experience_level,created_at,updated_at'
    )
    .eq('coffee_log_id', coffeeLogId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapTelemetryRow(data as TelemetryRow);
}
