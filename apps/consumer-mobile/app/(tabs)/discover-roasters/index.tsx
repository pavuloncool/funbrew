import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppCard, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { supabase } from '../../../src/services/supabaseClient';
import { pageStyles } from '../../../src/theme/pageStyles';
import { visualSystemTokens } from '@funcup/shared';

type RoasterCardTarget = {
  id: string;
  name: string;
};

type LoadState = 'loading' | 'success' | 'empty' | 'error';

export default function DiscoverRoastersScreen() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roasterTarget, setRoasterTarget] = useState<RoasterCardTarget | null>(null);

  const loadFirstRoaster = async () => {
    setState('loading');
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('roasters')
      .select('id,name')
      .order('name', { ascending: true })
      .limit(1);

    if (error) {
      setState('error');
      setErrorMessage(error.message);
      return;
    }

    const first = (data as RoasterCardTarget[] | null)?.[0] ?? null;
    if (!first) {
      setState('empty');
      setRoasterTarget(null);
      return;
    }

    setRoasterTarget(first);
    setState('success');
  };

  useEffect(() => {
    void loadFirstRoaster();
  }, []);

  return (
    <AppScrollScreen contentContainerStyle={pageStyles.content}>
      <AppText variant="h2" weight="700">Discover Roasters</AppText>
      <AppText tone="secondary">
        Coming soon: followed roasters and roasters from your rated coffees.
      </AppText>

      <AppCard style={styles.card}>
        {state === 'loading' ? <AppText>Loading roaster card target...</AppText> : null}

        {state === 'empty' ? (
          <View style={styles.block}>
            <AppText>No roasters available yet.</AppText>
          </View>
        ) : null}

        {state === 'error' ? (
          <View style={styles.block}>
            <AppText tone="danger">Could not load roaster list.</AppText>
            {errorMessage ? <AppText tone="secondary">{errorMessage}</AppText> : null}
            <AppButton label="Retry" variant="secondary" onPress={() => void loadFirstRoaster()} />
          </View>
        ) : null}

        {state === 'success' && roasterTarget ? (
          <View style={styles.block}>
            <AppText tone="secondary">Sample roaster card</AppText>
            <AppText variant="h3" weight="700">{roasterTarget.name}</AppText>
            <AppButton
              label="Open roaster card"
              onPress={() =>
                router.push({
                  pathname: '/roaster/[id]',
                  params: { id: roasterTarget.id },
                })
              }
            />
          </View>
        ) : null}
      </AppCard>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: visualSystemTokens.spacing.xxs },
  block: { gap: visualSystemTokens.spacing.xs },
});
