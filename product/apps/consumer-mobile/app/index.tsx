import { resolvePostEntryHref, visualSystemTokens } from '@funcup/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../src/auth';
import { MobileEntrySplash } from '../src/components/entry/MobileEntrySplash';
import {
  hasCompletedEntrySplashThisSession,
  markEntrySplashCompleteForSession,
} from '../src/components/entry/entrySession';
import { AppScreen } from '../src/components/ui/primitives';

/**
 * FR-012 entry (Phase 010-004): fingerprint → tap → confetti → bean once per process start,
 * then route directly to auth stack or main tabs based on the restored session.
 * Reduced motion uses AccessibilityInfo.isReduceMotionEnabled() + shortened/static motion.
 */
export default function Index() {
  const router = useRouter();
  const { status, profileCompleted } = useAuth();
  const [splashComplete, setSplashComplete] = useState(hasCompletedEntrySplashThisSession);

  const targetHref = resolvePostEntryHref({ status, profileCompleted });

  useEffect(() => {
    if (!splashComplete || !targetHref) {
      return;
    }

    router.replace(targetHref);
  }, [router, splashComplete, targetHref]);

  if (!splashComplete) {
    return (
      <MobileEntrySplash
        onComplete={() => {
          markEntrySplashCompleteForSession();
          setSplashComplete(true);
        }}
      />
    );
  }

  return (
    <AppScreen style={styles.loading}>
      <ActivityIndicator size="large" color={visualSystemTokens.colors.accentPrimary} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
