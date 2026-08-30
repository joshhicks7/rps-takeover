import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Display, IconButton, PanelButton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { CAMPAIGN } from '@/game/campaign';
import { colors, fonts } from '@/theme';

export default function SettingsScreen() {
  const { user, logout, backendKind } = useAuth();
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton label="✕" onPress={() => router.back()} />
        <Display size={28}>SETTINGS</Display>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.block}>
        <Body muted>PLAYER</Body>
        <Text style={styles.value}>{user?.username}</Text>
        <Body muted>EMAIL</Body>
        <Text style={styles.value}>{user?.email}</Text>
        <Body muted>BACKEND</Body>
        <Text style={styles.value}>{backendKind.toUpperCase()}</Text>
        <Body muted>CAMPAIGN</Body>
        <Text style={styles.value}>
          {user?.clearedCampaign.length ?? 0} / {CAMPAIGN.length} CLEARED
        </Text>
      </View>
      <PanelButton
        label="LOG OUT"
        onPress={async () => {
          await logout();
          router.replace('/login');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  block: { gap: 8, marginVertical: 24 },
  value: { color: colors.text, fontFamily: fonts.display, fontSize: 20, marginBottom: 8 },
});
