import { StyleSheet, Text, View } from 'react-native';

import type { Cell, Rps } from '@/game/types';
import { colors } from '@/theme';

export function Piece({
  cell,
  size = 18,
}: {
  cell: Cell | Rps | 'empty';
  size?: number;
}) {
  if (cell === 'wall' || cell === 'empty') return null;
  if (cell === 'rock') {
    return (
      <View
        style={[
          styles.rock,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }
  if (cell === 'paper') {
    return (
      <View
        style={[
          styles.paper,
          { width: size * 0.82, height: size * 0.82 },
        ]}
      />
    );
  }
  if (cell === 'scissors') {
    return <Text style={{ fontSize: size * 0.85, lineHeight: size }}>✂️</Text>;
  }
  const xColor =
    cell === 'no-rock' ? colors.noRock : cell === 'no-paper' ? colors.noPaper : colors.noScissors;
  return (
    <Text style={{ color: xColor, fontSize: size * 0.9, fontWeight: '900', lineHeight: size }}>
      ✕
    </Text>
  );
}

const styles = StyleSheet.create({
  rock: {
    backgroundColor: colors.rock,
    borderWidth: 1,
    borderColor: '#cfcfcf',
  },
  paper: {
    backgroundColor: colors.paper,
  },
});
