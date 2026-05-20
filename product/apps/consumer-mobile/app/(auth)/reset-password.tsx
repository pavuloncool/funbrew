import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { supabase } from '../../src/services/supabaseClient';
import { authScreenStyles as styles } from '../../src/theme/authScreenStyles';
import { AppButton, AppInput, AppScreen } from '../../src/components/ui/primitives';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [loadingSession, setLoadingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasSession(Boolean(data.session?.access_token));
      setLoadingSession(false);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSession(Boolean(session?.access_token));
      setLoadingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const onSetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Wypełnij oba pola hasła.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Hasło musi mieć min. 6 znaków.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Hasła nie są takie same.');
      return;
    }

    setSaving(true);
    setError(null);
    setInfo(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setInfo('Hasło zostało ustawione. Możesz się zalogować nowym hasłem.');
    router.replace('/(auth)/login-form');
  };

  if (loadingSession) {
    return (
      <AppScreen>
        <View style={styles.screen}>
          <View style={[styles.topSection, styles.centered]}>
            <Text>Sprawdzanie linku resetującego…</Text>
          </View>
        </View>
      </AppScreen>
    );
  }

  if (!hasSession) {
    return (
      <AppScreen>
        <View style={styles.screen}>
          <View style={styles.topSection}>
            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Reset hasła</Text>
              <View style={styles.separatorLine} />
            </View>

            <Text style={styles.infoText}>
              Ten ekran działa z aktywnym linkiem z emaila. Otwórz ponownie wiadomość i kliknij link resetujący.
            </Text>
          </View>

          <Text style={styles.registerPrompt}>
            <Link href="/(auth)/forgot-password" style={styles.registerLink}>
              Wyślij nowy link resetujący.
            </Link>
          </Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.screen}>
        <View style={styles.topSection}>
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>Ustaw nowe hasło</Text>
            <View style={styles.separatorLine} />
          </View>

          <Text style={styles.fieldLabel}>Nowe hasło</Text>
          <AppInput
            style={styles.input}
            placeholder="Minimum 6 znaków"
            accessibilityLabel="Nowe hasło"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>Powtórz nowe hasło</Text>
          <AppInput
            style={styles.input}
            placeholder="Powtórz nowe hasło"
            accessibilityLabel="Powtórz nowe hasło"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => void onSetPassword()}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {info ? <Text style={styles.infoText}>{info}</Text> : null}

          <AppButton label={saving ? 'Zapisywanie…' : 'Zapisz nowe hasło'} onPress={() => void onSetPassword()} />
        </View>

        <Text style={styles.registerPrompt}>
          <Link href="/(auth)/login-form" style={styles.registerLink}>
            Wróć do logowania.
          </Link>
        </Text>
      </View>
    </AppScreen>
  );
}
