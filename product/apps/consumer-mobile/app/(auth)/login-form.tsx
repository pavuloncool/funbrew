import { Link, useRouter } from 'expo-router';
import {
  canAccessSurface,
  getDeniedAccessReason,
  getMobileLoginReasonMessage,
  resolveAccountRole,
} from '@funcup/shared';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { authScreenStyles as styles } from '../../src/theme/authScreenStyles';
import { AppButton, AppInput, AppScreen } from '../../src/components/ui/primitives';
import { useAuth } from '../../src/auth';
import { supabase } from '../../src/services/supabaseClient';

export default function LoginFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reason?: string }>();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const roleGateMessage = getMobileLoginReasonMessage(params.reason);

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Wpisz email i hasło.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login({
        email: email.trim(),
        password,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const role = await resolveAccountRole(supabase, user.id, user.user_metadata);
        if (!canAccessSurface(role, 'consumer_mobile')) {
          await logout();
          setError(getMobileLoginReasonMessage(getDeniedAccessReason('consumer_mobile')));
          return;
        }
      }

      router.replace('/(auth)/login');
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Logowanie nie powiodło się.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.screen}>
        <View style={styles.topSection}>
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>Logowanie</Text>
            <View style={styles.separatorLine} />
          </View>

          <Text style={styles.fieldLabel}>Email</Text>
          <AppInput
            style={styles.input}
            placeholder="Email"
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.fieldLabel}>Hasło</Text>
          <AppInput
            style={styles.input}
            placeholder="Hasło"
            accessibilityLabel="Hasło"
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => void onLogin()}
            value={password}
            onChangeText={setPassword}
          />

          <AppButton label={loading ? 'Logowanie…' : 'Zaloguj'} onPress={() => void onLogin()} />

          <Link href="/(auth)/forgot-password" style={styles.registerLink}>
            Nie pamiętasz hasła?
          </Link>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!error && roleGateMessage ? <Text style={styles.errorText}>{roleGateMessage}</Text> : null}

        </View>

        <Text style={styles.registerPrompt}>
          Nie masz konta?{' '}
          <Link href="/(auth)/register" style={styles.registerLink}>
            Zarejestruj.
          </Link>
        </Text>
      </View>
    </AppScreen>
  );
}
