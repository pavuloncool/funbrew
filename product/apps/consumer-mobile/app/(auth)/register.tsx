import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { authScreenStyles as styles } from '../../src/theme/authScreenStyles';
import { AppButton, AppInput, AppScreen } from '../../src/components/ui/primitives';
import { useAuth } from '../../src/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (displayName.trim().length < 3) {
      setError('Nazwa użytkownika musi mieć min. 3 znaki.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Wpisz email i hasło.');
      return;
    }
    if (password.length < 6) {
      setError('Hasło musi mieć min. 6 znaków.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Hasła nie są takie same.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });
      if (result.hasSession) {
        router.replace({
          pathname: '/(auth)/complete-profile',
          params: {
            displayName: displayName.trim(),
            email: email.trim().toLowerCase(),
          },
        });
        return;
      }

      router.replace('/(auth)/login-form');
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : 'Rejestracja nie powiodła się.');
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
            <Text style={styles.separatorText}>Rejestracja</Text>
            <View style={styles.separatorLine} />
          </View>

          <Text style={styles.fieldLabel}>Nazwa użytkownika</Text>
          <AppInput
            style={styles.input}
            placeholder="Min. 3 chars"
            accessibilityLabel="Nazwa użytkownika"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
          />

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
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>Hasło</Text>
          <AppInput
            style={styles.input}
            placeholder="Minimum 6 znaków"
            accessibilityLabel="Hasło"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          
          <Text style={styles.fieldLabel}>Powtórz hasło</Text>
          <AppInput
            style={styles.input}
            placeholder="Powtórz hasło"
            accessibilityLabel="Powtórz hasło"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => void onRegister()}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {info ? <Text style={styles.infoText}>{info}</Text> : null}

          <AppButton label={loading ? 'Tworzenie…' : 'Załóż konto'} onPress={() => void onRegister()} />
        </View>

        <Text style={styles.registerPrompt}>
          Masz konto?{' '}
          <Link href="/(auth)/login-form" style={styles.registerLink}>
            Zaloguj.
          </Link>
        </Text>
      </View>
    </AppScreen>
  );
}
