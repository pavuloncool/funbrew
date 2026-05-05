import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { visualSystemTokens } from '@funcup/shared';

import { AppButton, AppScreen, AppText } from '../../src/components/ui/primitives';
import { useAuth } from '../../src/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { status, profileCompleted, unlockWithBiometrics } = useAuth();
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'bootstrapping') {
      return;
    }

    if (status === 'locked') {
      return;
    }

    if (status === 'unauthenticated') {
      router.replace('/(auth)/login-form');
      return;
    }

    const postLoginPath = profileCompleted ? '/(tabs)/hub' : '/(auth)/complete-profile';
    router.replace(postLoginPath);
  }, [profileCompleted, router, status]);

  const onUnlock = async () => {
    setUnlocking(true);
    setError(null);
    try {
      const unlocked = await unlockWithBiometrics();
      if (!unlocked) {
        setError('Odblokowanie anulowane.');
      }
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : 'Nie udało się odblokować sesji.');
    } finally {
      setUnlocking(false);
    }
  };

  if (status === 'locked') {
    return (
      <AppScreen style={styles.root}>
        <View style={styles.lockedCard}>
          <AppText variant="h3" weight="700">Sesja zablokowana</AppText>
          <AppText tone="secondary">Odblokuj biometrią, aby kontynuować.</AppText>
          {error ? <AppText tone="danger">{error}</AppText> : null}
          <AppButton label={unlocking ? 'Odblokowywanie…' : 'Odblokuj biometrią'} onPress={() => void onUnlock()} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.root}>
      <ActivityIndicator size="large" color={visualSystemTokens.colors.accentPrimary} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: visualSystemTokens.colors.canvas, alignItems: 'center', justifyContent: 'center' },
  lockedCard: {
    width: '100%',
    maxWidth: 320,
    gap: visualSystemTokens.spacing.sm,
    alignItems: 'center',
    paddingHorizontal: visualSystemTokens.spacing.lg,
  },
});
