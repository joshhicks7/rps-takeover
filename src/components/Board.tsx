import { Pressable, StyleSheet, View } from 'react-native';

import { Piece } from '@/components/Piece';
import type { Cell, Grid } from '@/game/types';
import { heightOf, widthOf } from '@/game/engine';

export function Board({
  grid,
  color,
  maxSize = 320,
  onPressCell,
  interactive = false,
  highlight,
}: {
  grid: Grid;
  color: string;
  maxSize?: number;
  onPressCell?: (row: number, col: number) => void;
  interactive?: boolean;
  highlight?: [number, number] | null;
}) {
  const rows = heightOf(grid);
  const cols = widthOf(grid);
  const cellSize = Math.max(10, Math.floor(Math.min(maxSize / Math.max(cols, 1), maxSize / Math.max(rows, 1))));
  const playable = (cell: Cell) => cell !== 'wall';

  return (
    <View style={{ backgroundColor: color, padding: 8, alignSelf: 'center' }}>
      <View style={{ width: cellSize * cols, height: cellSize * rows }}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            if (!playable(cell)) {
              return (
                <View
                  key={`${r}-${c}`}
                  style={{
                    position: 'absolute',
                    left: c * cellSize,
                    top: r * cellSize,
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: color,
                  }}
                />
              );
            }
            const selected = highlight?.[0] === r && highlight?.[1] === c;
            return (
              <Pressable
                key={`${r}-${c}`}
                disabled={!interactive}
                onPress={() => onPressCell?.(r, c)}
                style={{
                  position: 'absolute',
                  left: c * cellSize,
                  top: r * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: selected ? '#3a3a3a' : '#050505',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: '#8d8d8d',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Piece cell={cell} size={Math.max(10, cellSize - 4)} />
              </Pressable>
            );
          }),
        )}
      </View>
    </View>
  );
}
