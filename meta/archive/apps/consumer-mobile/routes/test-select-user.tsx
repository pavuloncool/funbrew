import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { authScreenStyles } from '../src/theme/authScreenStyles';
import { AppScreen, AppText } from '../src/components/ui/primitives';

const ROASTER_WEB_BASE =
  process.env.EXPO_PUBLIC_ROASTER_WEB_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export default function TestSelectUserScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <View style={authScreenStyles.screen}>
        <View style={[authScreenStyles.topSection, local.topTight]}>
          <AppText variant="h1" weight="700" style={local.title} accessibilityRole="header">
            funcup
          </AppText>
          <AppText tone="secondary" style={local.subtitle}>Wybierz ścieżkę (makieta)</AppText>

          <Pressable
            testID="btn-add-coffee"
            style={authScreenStyles.socialButton}
            accessibilityRole="button"
            accessibilityLabel="Roaster"
            onPress={() => {
              void Linking.openURL(`${ROASTER_WEB_BASE}/tag`);
            }}
          >
            <AppText weight="600" style={authScreenStyles.socialButtonText}>Roaster</AppText>
          </Pressable>

          <Pressable
            testID="btn-scan-coffee"
            style={authScreenStyles.socialButton}
            accessibilityRole="button"
            accessibilityLabel="Consumer"
            onPress={() => router.push('/(tabs)/scan/scan')}
          >
            <AppText weight="600" style={authScreenStyles.socialButtonText}>Consumer</AppText>
          </Pressable>

          <View style={local.footer}>
            <Link href="/(auth)/login-form" style={authScreenStyles.registerLink}>
              Ekran logowania (opcjonalnie)
            </Link>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

const local = StyleSheet.create({
  topTight: {
    marginTop: 80,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 28,
    textAlign: 'center',
  },
  footer: {
    marginTop: 24,
    marginBottom: 48,
  },
});
