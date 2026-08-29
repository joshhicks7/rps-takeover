import { Pressable, View } from 'react-native';

import { Piece } from '@/components/Piece';
import type { Cell, Grid } from '@/game/types';
import { heightOf, widthOf } from '@/game/engine';

const GAP = 3;
const MIN_CELL = 22;

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
  highlight?: [number, number] | null;
  interactive?: boolean;
}) {
  const rows = heightOf(grid);
  const cols = widthOf(grid);
  const cellSize = Math.max(
    MIN_CELL,
    Math.floor(
      Math.min(
        (maxSize - GAP * Math.max(cols - 1, 0)) / Math.max(cols, 1),
        (maxSize - GAP * Math.max(rows - 1, 0)) / Math.max(rows, 1),
      ),
    ),
  );
  const step = cellSize + GAP;
  const playable = (cell: Cell) => cell !== 'wall';

  return (
    <View style={{ backgroundColor: color, padding: 10, alignSelf: 'center' }}>
      <View
        style={{
          width: cols * cellSize + GAP * Math.max(cols - 1, 0),
          height: rows * cellSize + GAP * Math.max(rows - 1, 0),
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            if (!playable(cell)) {
              return (
                <View
                  key={`${r}-${c}`}
                  style={{
                    position: 'absolute',
                    left: c * step,
                    top: r * step,
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
                  left: c * step,
                  top: r * step,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: selected ? '#3a3a3a' : '#050505',
                  borderWidth: 1,
                  borderColor: '#c8c8c8',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Piece cell={cell} size={Math.max(10, cellSize - 8)} />
              </Pressable>
            );
          }),
        )}
      </View>
    </View>
  );
}
