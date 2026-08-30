import { StyleSheet, Text, View } from 'react-native';

import { Piece } from '@/components/Piece';
import type { Cell } from '@/game/types';
import { colors } from '@/theme';

const ITEMS: Array<{ cell: Cell; label: string }> = [
  { cell: 'rock', label: 'ROCK' },
  { cell: 'paper', label: 'PAPER' },
  { cell: 'scissors', label: 'SCISSORS' },
  { cell: 'no-rock', label: 'NO ROCK' },
  { cell: 'no-paper', label: 'NO PAPER' },
  { cell: 'no-scissors', label: 'NO SCISSORS' },
];

export function Legend() {
  return (
    <View style={styles.bar}>
      {ITEMS.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={styles.icon}>
            <Piece cell={item.cell} size={14} />
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#cfcfcf',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 6,
  },
  item: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#111',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
