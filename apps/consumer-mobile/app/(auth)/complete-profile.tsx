import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { visualSystemTokens } from '@funcup/shared';

import {
  loadEditableProfile,
  resolveAvatarOption,
  saveEditableProfile,
  serializeAvatar,
} from '../../src/features/profile/profileAccount';
import { buildAvatarOptions } from '../../src/features/profile/avatar/avatarFactory';
import { AvatarGrid } from '../../src/features/profile/avatar/AvatarGrid';
import {
  loadBrewMethodOptions,
  type BrewMethodOption,
} from '../../src/features/profile/preferences/brewMethods';
import {
  loadTastingNoteOptions,
  type TastingNoteOption,
} from '../../src/features/profile/preferences/tastingNotes';
import { BrewMethodPickerField } from '../../src/features/profile/preferences/BrewMethodPickerField';
import { FlavorNotesMultiSelect } from '../../src/features/profile/preferences/FlavorNotesMultiSelect';
import { supabase } from '../../src/services/supabaseClient';
import { authScreenStyles as styles } from '../../src/theme/authScreenStyles';
import { AppButton, AppScreen, AppText } from '../../src/components/ui/primitives';

function sameStringSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const leftSet = new Set(left);
  for (const item of right) {
    if (!leftSet.has(item)) {
      return false;
    }
  }
  return true;
}

export default function CompleteProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ displayName?: string; email?: string }>();
  const avatarOptions = useMemo(() => buildAvatarOptions(), []);
  const displayNameFromRoute = typeof params.displayName === 'string' ? params.displayName.trim() : '';
  const emailFromRoute = typeof params.email === 'string' ? params.email.trim().toLowerCase() : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarValue, setAvatarValue] = useState(serializeAvatar(avatarOptions[0]));
  const [favoriteBrewMethodId, setFavoriteBrewMethodId] = useState<string | null>(null);
  const [favoriteTastingNoteIds, setFavoriteFlavorNoteIds] = useState<string[]>([]);

  const [brewMethodOptions, setBrewMethodOptions] = useState<BrewMethodOption[]>([]);
  const [flavorNoteOptions, setFlavorNoteOptions] = useState<TastingNoteOption[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const selectedAvatar = useMemo(() => resolveAvatarOption(avatarValue), [avatarValue]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const [brewMethods, flavorNotes] = await Promise.all([
          loadBrewMethodOptions(supabase),
          loadTastingNoteOptions(supabase),
        ]);
        if (mounted) {
          setBrewMethodOptions(brewMethods);
          setFlavorNoteOptions(flavorNotes);
        }
        const profile = await loadEditableProfile(supabase);

        if (!mounted) return;

        setUserId(profile.userId);
        setDisplayName(profile.displayName || displayNameFromRoute);
        setEmail(profile.email || emailFromRoute);
        setAvatarValue(profile.avatarUrl);
        setFavoriteBrewMethodId(profile.favoriteBrewMethodId);
        const allowedIds = new Set(flavorNotes.map((item) => item.id));
        const prunedNotes = profile.favoriteTastingNoteIds.filter((id) => allowedIds.has(id));
        setFavoriteFlavorNoteIds(prunedNotes);
        if (prunedNotes.length !== profile.favoriteTastingNoteIds.length) {
          void saveEditableProfile({
            supabase,
            userId: profile.userId,
            displayName: profile.displayName || displayNameFromRoute,
            avatarUrl: profile.avatarUrl,
            favoriteBrewMethodId: profile.favoriteBrewMethodId,
            favoriteTastingNoteIds: prunedNotes,
          });
        }
      } catch (bootstrapError) {
        if (!mounted) return;
        setDisplayName(displayNameFromRoute);
        setEmail(emailFromRoute);
        setError(bootstrapError instanceof Error ? bootstrapError.message : 'Nie udało się załadować profilu.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [displayNameFromRoute, emailFromRoute]);

  const onSave = async () => {
    const trimmedName = displayName.trim();

    if (trimmedName.length < 3) {
      setError('Nazwa użytkownika musi mieć min. 3 znaki.');
      return;
    }

    if (!email.trim()) {
      setError('Brak adresu email użytkownika.');
      return;
    }

    if (!favoriteBrewMethodId) {
      setError('Wybierz ulubioną metodę parzenia.');
      return;
    }

    if (favoriteTastingNoteIds.length < 1) {
      setError('Wybierz minimum 1 tasting note.');
      return;
    }
    if (favoriteTastingNoteIds.length > 3) {
      setError('Możesz wybrać maksymalnie 3 tasting notes.');
      return;
    }

    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      await saveEditableProfile({
        supabase,
        userId,
        displayName: trimmedName,
        avatarUrl: avatarValue,
        favoriteBrewMethodId,
        favoriteTastingNoteIds,
        markCompleted: true,
      });

      const persisted = await loadEditableProfile(supabase);
      const brewOk = persisted.favoriteBrewMethodId === favoriteBrewMethodId;
      const notesOk = sameStringSet(persisted.favoriteTastingNoteIds, favoriteTastingNoteIds);
      if (!brewOk || !notesOk) {
        throw new Error('Nie udało się potwierdzić zapisu preferencji profilu. Spróbuj ponownie.');
      }

      router.replace('/(tabs)/profile');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nie udało się zapisać profilu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.screen}>
          <View style={[styles.topSection, local.center]}>
            <AppText>Ładowanie profilu…</AppText>
          </View>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.screen}>
        <ScrollView
          style={local.scroll}
          contentContainerStyle={local.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Uzupełnij profil</Text>
              <View style={styles.separatorLine} />
            </View>

            <Text style={styles.fieldLabel}>Nazwa użytkownika *</Text>
            <View style={local.readOnlyBox}>
              <AppText>{displayName || '—'}</AppText>
            </View>

            <Text style={styles.fieldLabel}>Email *</Text>
            <View style={local.readOnlyBox}>
              <AppText>{email || '—'}</AppText>
            </View>

            <Text style={styles.fieldLabel}>Avatar *</Text>
            <AvatarGrid
              options={avatarOptions}
              selectedId={selectedAvatar.id}
              onChange={(nextId) => {
                const selected = avatarOptions.find((item) => item.id === nextId);
                if (selected) {
                  setAvatarValue(serializeAvatar(selected));
                }
              }}
            />

            <BrewMethodPickerField
              options={brewMethodOptions}
              value={favoriteBrewMethodId}
              onChange={(nextValue) => setFavoriteBrewMethodId(nextValue)}
            />

            <FlavorNotesMultiSelect
              options={flavorNoteOptions}
              selectedIds={favoriteTastingNoteIds}
              onChange={setFavoriteFlavorNoteIds}
              maxSelected={3}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {info ? <Text style={styles.infoText}>{info}</Text> : null}

            <AppButton
              label={saving ? 'Zapisywanie…' : 'Zapisz i przejdź do profilu'}
              onPress={() => void onSave()}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </View>
    </AppScreen>
  );
}

const local = StyleSheet.create({
  scroll: {
    width: '100%',
  },
  content: {
    paddingBottom: visualSystemTokens.spacing.xl,
  },
  center: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readOnlyBox: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: visualSystemTokens.colors.borderDefault,
    borderRadius: visualSystemTokens.radius.sm,
    backgroundColor: visualSystemTokens.colors.surface,
    paddingHorizontal: visualSystemTokens.spacing.sm,
    justifyContent: 'center',
    marginBottom: visualSystemTokens.spacing.sm,
  },
});
