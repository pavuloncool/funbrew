import { visualSystemTokens } from '@funcup/shared';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ScreenError } from '../../../src/components/ScreenError';
import { AppScreen, AppText } from '../../../src/components/ui/primitives';
import { supabase } from '../../../src/services/supabaseClient';

type BatchQrRow = {
  hash: string;
};

function readBatchId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default function RoasterHubBatchDeepLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ batchId?: string | string[] }>();
  const batchId = readBatchId(params.batchId);

  const qrQuery = useQuery({
    queryKey: ['roasterHubBatchQrHash', batchId],
    enabled: Boolean(batchId),
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<string> => {
      if (!batchId) throw new Error('Missing batch id.');

      const { data, error } = await supabase
        .from('qr_codes')
        .select('hash')
        .eq('batch_id', batchId)
        .maybeSingle();

      if (error) throw error;
      const row = data as BatchQrRow | null;
      if (!row?.hash) {
        throw new Error('This batch does not have a public QR handoff yet.');
      }
      return row.hash;
    },
  });

  useEffect(() => {
    if (!qrQuery.data) return;
    router.replace({
      pathname: '/coffee/[hash]',
      params: { hash: qrQuery.data },
    });
  }, [qrQuery.data, router]);

  if (!batchId) {
    return (
      <AppScreen style={styles.centered}>
        <ScreenError title="Could not open batch" message="The batch link is missing an id." />
      </AppScreen>
    );
  }

  if (qrQuery.isError) {
    return (
      <AppScreen style={styles.centered}>
        <ScreenError
          title="Could not open batch"
          message={qrQuery.error instanceof Error ? qrQuery.error.message : 'Unable to resolve this batch link.'}
          onRetry={() => void qrQuery.refetch()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.centered}>
      <ActivityIndicator size="large" color={visualSystemTokens.colors.accentPrimary} />
      <AppText tone="secondary">Opening coffee details...</AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    gap: visualSystemTokens.spacing.sm,
    justifyContent: 'center',
    padding: visualSystemTokens.spacing.lg,
  },
});
