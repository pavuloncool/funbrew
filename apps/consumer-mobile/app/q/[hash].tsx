import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Deep link parity with web `/q/{hash}`: opens the same Coffee Page as `funcup://q/{hash}`.
 * Scheme: `funcup` (see app.json). Universal links / app links are configured in EAS.
 */
export default function QHashDeepLink() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  if (!hash || typeof hash !== 'string') {
    return <Redirect href="/(tabs)/hub" />;
  }
  return <Redirect href={{ pathname: '/coffee/[id]', params: { id: hash } }} />;
}
