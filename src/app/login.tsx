import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Display, PrimaryButton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts } from '@/theme';

export default function LoginScreen() {
  const { login, backendKind } = useAuth();
  const router = useRouter();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      await login(id, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.center}>
        <Display size={36}>RPS TAKE OVER</Display>
        <Body center muted>
          {backendKind === 'firebase' ? 'Firebase auth' : 'Local device accounts'}
        </Body>
        <TextInput
          placeholder="EMAIL OR USERNAME"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          value={id}
          onChangeText={setId}
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
        <PrimaryButton label={busy ? '...' : 'ENTER'} onPress={submit} disabled={busy} />
        <Link href="/register" style={styles.link}>
          CREATE ACCOUNT
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
    letterSpacing: 1,
  },
});
