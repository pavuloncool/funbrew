import { getReputationLevelLabel, resolveSensoryReputation, useCommunityReputationSummary, visualSystemTokens } from '@funcup/shared';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppCard, AppInput, AppScreen, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';

import {
  changePasswordWithReauth,
  loadEditableProfile,
  requestEmailChange,
  resolveAvatarOption,
  saveEditableProfile,
  serializeAvatar,
} from '../../../src/features/profile/profileAccount';
import { buildAvatarOptions } from '../../../src/features/profile/avatar/avatarFactory';
import { AvatarGrid } from '../../../src/features/profile/avatar/AvatarGrid';
import { AvatarPreview } from '../../../src/features/profile/avatar/AvatarPreview';
import { BrewMethodPickerField } from '../../../src/features/profile/preferences/BrewMethodPickerField';
import { FlavorNotesMultiSelect } from '../../../src/features/profile/preferences/FlavorNotesMultiSelect';
import { loadBrewMethodOptions, type BrewMethodOption } from '../../../src/features/profile/preferences/brewMethods';
import { loadTastingNoteOptions, type TastingNoteOption } from '../../../src/features/profile/preferences/tastingNotes';
import { supabase } from '../../../src/services/supabaseClient';
import { useAuth } from '../../../src/auth';

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

const { colors, spacing } = visualSystemTokens;

export default function ProfileScreen() {
  const router = useRouter();
  const { biometricsEnabled, disableBiometrics, enableBiometrics, lockWithBiometrics, logout } = useAuth();
  const avatarOptions = useMemo(() => buildAvatarOptions(), []);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [avatarValue, setAvatarValue] = useState(serializeAvatar(avatarOptions[0]));
  const [favoriteBrewMethodId, setFavoriteBrewMethodId] = useState<string | null>(null);
  const [favoriteTastingNoteIds, setFavoriteFlavorNoteIds] = useState<string[]>([]);
  const [sensoryScore, setSensoryScore] = useState(0);
  const [sensoryLevel, setSensoryLevel] = useState<'beginner' | 'advanced' | 'expert'>('beginner');
  const [sensoryLevelOverride, setSensoryLevelOverride] = useState<'beginner' | 'advanced' | 'expert' | null>(null);
  const [brewMethodOptions, setBrewMethodOptions] = useState<BrewMethodOption[]>([]);
  const [flavorNoteOptions, setFlavorNoteOptions] = useState<TastingNoteOption[]>([]);

  const [editMode, setEditMode] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const communitySummaryQuery = useCommunityReputationSummary({ supabase, userId: userId || null });
  const reputation = useMemo(
    () =>
      resolveSensoryReputation({
        sensoryScore,
        sensoryLevel,
        sensoryLevelOverride,
      }),
    [sensoryLevel, sensoryLevelOverride, sensoryScore]
  );

  const selectedAvatar = useMemo(() => resolveAvatarOption(avatarValue), [avatarValue]);
  const selectedAvatarSvg = useMemo(
    () => avatarOptions.find((option) => option.id === selectedAvatar.id)?.svg ?? avatarOptions[0].svg,
    [avatarOptions, selectedAvatar.id]
  );
  const favoriteBrewMethodLabel = useMemo(() => {
    const selected = brewMethodOptions.find((option) => option.id === favoriteBrewMethodId);
    if (selected?.name) {
      return selected.name;
    }
    if (favoriteBrewMethodId) {
      return `Wybrane (ID: ${favoriteBrewMethodId})`;
    }
    return 'Nie ustawiono';
  }, [brewMethodOptions, favoriteBrewMethodId]);
  const favoriteTastingNotesLabel = useMemo(() => {
    if (favoriteTastingNoteIds.length === 0) {
      return 'Nie ustawiono';
    }

    const labels = flavorNoteOptions
      .filter((option) => favoriteTastingNoteIds.includes(option.id))
      .map((option) => option.label);

    if (labels.length > 0) {
      return labels.join(', ');
    }

    return `Wybrane (IDs: ${favoriteTastingNoteIds.join(', ')})`;
  }, [flavorNoteOptions, favoriteTastingNoteIds]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const [profile, brewMethods, flavorNotes] = await Promise.all([
          loadEditableProfile(supabase),
          loadBrewMethodOptions(supabase),
          loadTastingNoteOptions(supabase),
        ]);
        if (!mounted) return;

        setUserId(profile.userId);
        setDisplayName(profile.displayName);
        setEmail(profile.email);
        setOriginalEmail(profile.email);
        setAvatarValue(profile.avatarUrl);
        setFavoriteBrewMethodId(profile.favoriteBrewMethodId);
        const allowedIds = new Set(flavorNotes.map((item) => item.id));
        const prunedNotes = profile.favoriteTastingNoteIds.filter((id) => allowedIds.has(id));
        setFavoriteFlavorNoteIds(prunedNotes);
        setSensoryScore(profile.sensoryScore);
        setSensoryLevel(profile.sensoryLevel);
        setSensoryLevelOverride(profile.sensoryLevelOverride);
        setBrewMethodOptions(brewMethods);
        setFlavorNoteOptions(flavorNotes);
        if (prunedNotes.length !== profile.favoriteTastingNoteIds.length) {
          void saveEditableProfile({
            supabase,
            userId: profile.userId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            favoriteBrewMethodId: profile.favoriteBrewMethodId,
            favoriteTastingNoteIds: prunedNotes,
          });
        }
      } catch (bootstrapError) {
        if (!mounted) return;
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
  }, []);

  const onSaveProfile = async () => {
    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError('Podaj nazwę użytkownika.');
      return;
    }

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError('Podaj poprawny adres email.');
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
      });

      if (trimmedEmail !== originalEmail.toLowerCase()) {
        const result = await requestEmailChange({
          supabase,
          nextEmail: trimmedEmail,
        });

        if (result.simulated) {
          setInfo('Wersja developerska: zasymulowano potwierdzenie zmiany email.');
        } else {
          setInfo('Wysłaliśmy link potwierdzający zmianę email na nowy adres.');
        }
      } else {
        setInfo('Dane profilu zapisane.');
      }

      const refreshed = await loadEditableProfile(supabase);
      setSensoryScore(refreshed.sensoryScore);
      setSensoryLevel(refreshed.sensoryLevel);
      setSensoryLevelOverride(refreshed.sensoryLevelOverride);
      setEditMode(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nie udało się zapisać profilu.');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Wypełnij wszystkie pola zmiany hasła.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Nowe hasło musi mieć min. 6 znaków.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Nowe hasła nie są takie same.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Nowe hasło musi być inne niż aktualne.');
      return;
    }

    setPasswordSaving(true);
    setError(null);
    setInfo(null);

    try {
      await changePasswordWithReauth({
        supabase,
        email: originalEmail,
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setInfo('Hasło zostało zmienione.');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Nie udało się zmienić hasła.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const onToggleBiometrics = async () => {
    setError(null);
    setInfo(null);
    try {
      if (biometricsEnabled) {
        await disableBiometrics();
        setInfo('Odblokowanie biometrią zostało wyłączone.');
      } else {
        await enableBiometrics();
        setInfo('Odblokowanie biometrią zostało włączone.');
      }
    } catch (biometricError) {
      setError(biometricError instanceof Error ? biometricError.message : 'Nie udało się zmienić ustawień biometrii.');
    }
  };

  const onLockSession = async () => {
    setError(null);
    setInfo(null);
    try {
      await lockWithBiometrics();
      router.replace('/(auth)/login');
    } catch (lockError) {
      setError(lockError instanceof Error ? lockError.message : 'Nie udało się zablokować sesji.');
    }
  };

  const onLogout = async () => {
    setLogoutLoading(true);
    setError(null);
    setInfo(null);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Nie udało się wylogować.');
    } finally {
      setLogoutLoading(false);
    }
  };

  const onGoToMyCoffeeHouse = () => {
    router.push('/(tabs)/hub');
  };

  if (loading) {
    return (
      <AppScreen>
        <View style={local.centered}>
          <AppText>Ładowanie profilu…</AppText>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScrollScreen contentContainerStyle={[local.content, { paddingBottom: 96 + insets.bottom }]}>
        <AppText variant="h2" weight="700">Profile</AppText>

        <AppCard>
          <View style={local.headerRow}>
            <AvatarPreview svg={selectedAvatarSvg} style={local.avatarCircle} />
            <View style={local.headerTextWrap}>
              <AppText variant="h3" weight="700">{displayName || 'Użytkownik'}</AppText>
              <AppText tone="secondary">{email || 'Brak email'}</AppText>
            </View>
          </View>

          <AppButton
            label="fun•brew home"
            onPress={onGoToMyCoffeeHouse}
          />
        </AppCard>

        <AppCard>
          <AppText variant="body" weight="600">Sensory reputation</AppText>
          <AppText variant="h2" weight="700">{getReputationLevelLabel(reputation.effectiveLevel)}</AppText>
          <AppText tone="secondary">Score: {sensoryScore}</AppText>
          <AppText tone="secondary">Fav brew method: {favoriteBrewMethodLabel}</AppText>
          <AppText tone="secondary">Fav tasting notes: {favoriteTastingNotesLabel}</AppText>
          <AppText tone="secondary">
            Community helpful: {communitySummaryQuery.data?.helpfulReceived ?? 0} across {communitySummaryQuery.data?.reviewCount ?? 0} public reviews
          </AppText>
        </AppCard>

        <AppCard>
          <AppText variant="body" weight="600">Bezpieczeństwo sesji</AppText>
          <AppText tone="secondary">
            Biometria: {biometricsEnabled ? 'włączona' : 'wyłączona'}
          </AppText>
          <AppButton
            label={biometricsEnabled ? 'Wyłącz odblokowanie biometrią' : 'Włącz odblokowanie biometrią'}
            variant="secondary"
            onPress={() => void onToggleBiometrics()}
          />
          <AppButton
            label="Zablokuj sesję"
            variant="secondary"
            onPress={() => void onLockSession()}
            disabled={!biometricsEnabled}
          />
        </AppCard>

        {editMode ? (
          <AppCard>
            <AppText variant="body" weight="600">Edycja profilu</AppText>
            <AppInput
              style={local.input}
              placeholder="Nazwa użytkownika"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <AppInput
              style={local.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <AppText variant="bodySm" weight="600" style={local.subSectionLabel}>Avatar</AppText>
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

            <AppButton label={saving ? 'Zapisywanie…' : 'Zapisz profil'} onPress={() => void onSaveProfile()} disabled={saving} />

            <View style={local.divider} />
            <AppText variant="body" weight="600">Zmiana hasła</AppText>
            <AppText variant="bodySm" weight="600">Aktualne hasło</AppText>
            <AppInput
              style={local.input}
              placeholder="Aktualne hasło"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <AppText variant="bodySm" weight="600">Nowe hasło</AppText>
            <AppInput
              style={local.input}
              placeholder="Nowe hasło"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <AppText variant="bodySm" weight="600">Powtórz nowe hasło</AppText>
            <AppInput
              style={local.input}
              placeholder="Powtórz nowe hasło"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => void onChangePassword()}
            />
            <AppButton
              label={passwordSaving ? 'Zmiana hasła…' : 'Zmień hasło'}
              variant="secondary"
              onPress={() => void onChangePassword()}
              disabled={passwordSaving}
            />
          </AppCard>
        ) : null}

        {error ? <AppText tone="danger">{error}</AppText> : null}
        {info ? <AppText tone="success">{info}</AppText> : null}
        <AppCard>
          <AppButton
            label={editMode ? 'Zamknij edycję' : 'Edit profile'}
            variant="secondary"
            onPress={() => setEditMode((prev) => !prev)}
          />
          <AppButton
            label={logoutLoading ? 'Wylogowywanie…' : 'Log out'}
            variant="secondary"
            onPress={() => void onLogout()}
            disabled={logoutLoading}
          />
        </AppCard>
    </AppScrollScreen>
  );
}

const local = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: visualSystemTokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    marginBottom: spacing.xxs,
  },
  subSectionLabel: {
    marginTop: spacing.xxs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },
});
