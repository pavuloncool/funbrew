import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { supabase } from '../../src/services/supabaseClient';
import { authScreenStyles as styles } from '../../src/theme/authScreenStyles';
import { AppButton, AppInput, AppScreen } from '../../src/components/ui/primitives';

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSendReset = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError('Podaj poprawny adres email.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    const redirectTo = Linking.createURL('/(auth)/reset-password');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setInfo('Wysłaliśmy email z linkiem do ustawienia nowego hasła.');
  };

  return (
    <AppScreen>
      <View style={styles.screen}>
        <View style={styles.topSection}>
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>Reset hasła</Text>
            <View style={styles.separatorLine} />
          </View>

          <Text style={styles.fieldLabel}>Email</Text>
          <AppInput
            style={styles.input}
            placeholder="name@example.com"
            accessibilityLabel="Adres email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="done"
            onSubmitEditing={() => void onSendReset()}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {info ? <Text style={styles.infoText}>{info}</Text> : null}

          <AppButton label={loading ? 'Wysyłanie…' : 'Wyślij link resetujący'} onPress={() => void onSendReset()} />
        </View>

        <Text style={styles.registerPrompt}>
          Pamiętasz hasło?{' '}
          <Link href="/(auth)/login-form" style={styles.registerLink}>
            Wróć do logowania.
          </Link>
        </Text>
      </View>
    </AppScreen>
  );
}
