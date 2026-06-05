import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

type FallbackMethod = 'push' | 'replace';

export function useGoBackOrFallback(fallbackHref: Href, fallbackMethod: FallbackMethod = 'replace') {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const router = useRouter();

  return useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }

    if (fallbackMethod === 'push') {
      router.push(fallbackHref);
      return;
    }

    router.replace(fallbackHref);
  }, [fallbackHref, fallbackMethod, navigation, router]);
}
