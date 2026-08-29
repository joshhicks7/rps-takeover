import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Display, PrimaryButton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts } from '@/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await register({ username, email, password });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.center}>
        <Display size={32}>JOIN THE BOARD</Display>
        <TextInput
          placeholder="USERNAME"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          placeholder="EMAIL"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="PASSWORD"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={busy ? '...' : 'CREATE'} onPress={submit} disabled={busy} />
        <Link href="/login" style={styles.link}>
          BACK TO LOGIN
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: colors.text,
    color: colors.text,
    paddingVertical: 10,
    fontFamily: fonts.display,
    letterSpacing: 1,
  },
  error: {
    color: colors.red,
    textAlign: 'center',
  },
  link: {
    color: colors.text,
    textAlign: 'center',
    fontFamily: fonts.display,
  },
});
