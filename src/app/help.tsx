import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Legend } from '@/components/Legend';
import { Body, Display, IconButton, Screen } from '@/components/ui';

export default function HelpScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.top}>
        <IconButton label="✕" onPress={() => router.back()} />
        <Display size={28}>HELP</Display>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Display size={18}>HOW TO TAKE OVER</Display>
        <Body>
          You are given a winner type — rock, paper, or scissors — and a number of pieces to place.
          Tap empty cells only. After the last piece is placed, every rock, paper, and scissors
          spreads like wildfire into 4-way neighbors.
        </Body>
        <Display size={16}>ROCK TAKES SCISSORS</Display>
        <Display size={16}>SCISSORS TAKES PAPER</Display>
        <Display size={16}>PAPER TAKES ROCK</Display>
        <Body>
          The winner type expands first each tick. No-rock / no-paper / no-scissors tiles block that
          type from entering, but the other two types can convert them. Walls never change. You win
          when every playable cell is the winner type.
        </Body>
        <Body>
          Draft and private levels are only for you. Public levels show up in Explore under your
          username. Long-press your level in Explore to edit it.
        </Body>
        <Legend />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { gap: 14, paddingBottom: 32 },
});
