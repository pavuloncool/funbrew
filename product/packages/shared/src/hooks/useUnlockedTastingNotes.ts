import { useQuery } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';
import { resolveSensoryReputation } from '../constants/reputation';
import { buildSensoryUnlockState, getRequiredUnlockLevelForTastingNote } from '../sensoryProgression';

export type UnlockedTastingNoteOption = {
  id: string;
  name: string;
  label: string;
  category: string;
  sortOrder: number;
  isUnlocked: boolean;
  requiredLevel: 'beginner' | 'advanced' | 'expert';
};

type TastingNoteRow = {
  id: string;
  name: string;
  label: string;
  category: string;
  sort_order: number;
};

async function fetchTastingNoteRows(supabase: TypedSupabaseClient): Promise<TastingNoteRow[]> {
  const primary = await supabase
    .from('tasting_notes')
    .select('id,name,label,category,sort_order')
    .order('sort_order', { ascending: true })
    .returns<TastingNoteRow[]>();

  if (!primary.error) {
    return primary.data ?? [];
  }

  const fallback = await supabase
    .from('flavor_notes')
    .select('id,name,label,category,sort_order')
    .order('sort_order', { ascending: true })
    .returns<TastingNoteRow[]>();

  if (fallback.error) {
    throw new Error(primary.error.message);
  }

  return fallback.data ?? [];
}

export function useUnlockedTastingNotes(params: {
  supabase: TypedSupabaseClient;
  userId: string | null;
}) {
  return useQuery({
    queryKey: ['unlockedTastingNotes', params.userId],
    enabled: Boolean(params.userId),
    queryFn: async () => {
      if (!params.userId) throw new Error('userId is required');

      const [userResult, noteRows] = await Promise.all([
        params.supabase
          .from('users')
          .select('sensory_score,sensory_level,sensory_level_override')
          .eq('id', params.userId)
          .returns<
            Array<{
              sensory_score: number;
              sensory_level: 'beginner' | 'advanced' | 'expert';
              sensory_level_override: 'beginner' | 'advanced' | 'expert' | null;
            }>
          >(),
        fetchTastingNoteRows(params.supabase),
      ]);

      if (userResult.error) throw userResult.error;
      const userRow = userResult.data?.[0];

      const reputation = resolveSensoryReputation({
        sensoryScore: userRow?.sensory_score,
        sensoryLevel: userRow?.sensory_level,
        sensoryLevelOverride: userRow?.sensory_level_override,
      });
      const unlockState = buildSensoryUnlockState(
        reputation.score,
        noteRows.map((row) => row.name),
        reputation.effectiveLevel
      );
      const unlockedSet = new Set(unlockState.unlockedNames);
      const options: UnlockedTastingNoteOption[] = noteRows.map((row) => ({
        id: row.id,
        name: row.name,
        label: row.label,
        category: row.category,
        sortOrder: row.sort_order,
        isUnlocked: unlockedSet.has(row.name.replace(/_/g, '-')),
        requiredLevel: getRequiredUnlockLevelForTastingNote(row.name),
      }));

      return {
        score: reputation.score,
        computedLevel: reputation.computedLevel,
        storedLevel: reputation.storedLevel,
        overrideLevel: reputation.overrideLevel,
        effectiveLevel: reputation.effectiveLevel,
        isOverridden: reputation.isOverridden,
        level: unlockState.level,
        levelLabel: unlockState.levelLabel,
        unlockHint: unlockState.unlockHint,
        nextLevel: unlockState.nextLevel,
        nextLevelLabel: unlockState.nextLevelLabel,
        options,
        unlockedOptions: options.filter((option) => option.isUnlocked),
        lockedOptions: options.filter((option) => !option.isUnlocked),
      };
    },
  });
}
