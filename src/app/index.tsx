import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Board } from '@/components/Board';
import { Display, IconButton, PrimaryButton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { CAMPAIGN } from '@/game/campaign';
import { colors, fonts } from '@/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const next =
    CAMPAIGN.find((level) => !user?.clearedCampaign.includes(level.id)) ?? CAMPAIGN[0];

  async function share() {
    const message = 'Play RPS Take Over — place rock, paper, or scissors and take over the board.';
    await Clipboard.setStringAsync(message);
    Alert.alert('Copied', 'Share text copied to the clipboard.');
  }

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton label="⚙" onPress={() => router.push('/settings')} />
        <View style={{ flex: 1 }} />
        <Text style={styles.user}>{user?.username.toUpperCase()}</Text>
        <IconButton label="?" onPress={() => router.push('/help')} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.rps}>
          <Text style={{ color: colors.rLetter }}>R</Text>
          <Text style={{ color: colors.pLetter }}>P</Text>
          <Text style={{ color: colors.sLetter }}>S</Text>
        </Text>
        <Display size={42}>TAKE OVER</Display>
      </View>

      <View style={styles.board}>
        <Board grid={CAMPAIGN[2].grid} color={CAMPAIGN[2].color} maxSize={260} />
      </View>

      <PrimaryButton label="PLAY" onPress={() => router.push(`/play/${next.id}`)} />

      <View style={styles.bottom}>
        <View>
          <Text style={styles.tryMe}>TRY ME</Text>
          <Text style={styles.arrows}>▼ ▼</Text>
          <View style={styles.row}>
            <Pressable onPress={() => router.push('/create')} style={styles.small}>
              <Text style={styles.smallText}>＋</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/explore')} style={styles.small}>
              <Text style={styles.smallText}>⌕</Text>
            </Pressable>
          </View>
        </View>
        <Pressable onPress={() => void share()}>
          <Text style={styles.smallText}>↗</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  user: {
    color: colors.text,
    fontFamily: fonts.display,
    marginRight: 8,
    letterSpacing: 1,
  },
  hero: {
    alignItems: 'center',
    marginTop: 8,
  },
  rps: {
    fontFamily: fonts.displayBlack,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: 4,
  },
  board: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 12,
  },
  tryMe: {
    color: colors.green,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  arrows: {
    color: colors.green,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  small: {
    padding: 4,
  },
  smallText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
});
