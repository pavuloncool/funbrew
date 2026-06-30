import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

type FallbackMethod = 'push' | 'replace';

type GoBackOrFallbackOptions = {
  preferHistory?: boolean;
};

export function useGoBackOrFallback(
  fallbackHref: Href,
  fallbackMethod: FallbackMethod = 'replace',
  options: GoBackOrFallbackOptions = {}
) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const router = useRouter();
  const preferHistory = options.preferHistory ?? true;

  return useCallback(() => {
    if (preferHistory && navigation.canGoBack()) {
      router.back();
      return;
    }

    if (fallbackMethod === 'push') {
      router.push(fallbackHref);
      return;
    }

    router.replace(fallbackHref);
  }, [fallbackHref, fallbackMethod, navigation, preferHistory, router]);
}
