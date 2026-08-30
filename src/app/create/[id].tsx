import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Board } from '@/components/Board';
import { Piece } from '@/components/Piece';
import { Body, Display, IconButton, PanelButton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { blankGrid, cloneGrid, heightOf, resizeGrid, widthOf } from '@/game/engine';
import type { Cell, Grid, Level, Rps, Visibility, WinOption } from '@/game/types';
import { MAX_BOARD, MIN_BOARD } from '@/game/types';
import { setPreviewLevel } from '@/preview';
import { getBackend } from '@/services';
import { colors, fonts, LEVEL_COLORS } from '@/theme';

const TOOLS: Cell[] = [
  'empty',
  'wall',
  'rock',
  'paper',
  'scissors',
  'no-rock',
  'no-paper',
  'no-scissors',
];

function newId() {
  return `lvl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('UNTITLED');
  const [grid, setGrid] = useState<Grid>(() => blankGrid(8, 8));
  const [winner, setWinner] = useState<Rps>('rock');
  const [howMany, setHowMany] = useState(1);
  const [color, setColor] = useState(LEVEL_COLORS[0]);
  const [tool, setTool] = useState<Cell | 'hint'>('rock');
  const [visibility, setVisibility] = useState<Visibility>('draft');
  const [levelId, setLevelId] = useState(id && id !== 'index' ? id : newId());
  const [createdAt, setCreatedAt] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [winOptions, setWinOptions] = useState<WinOption[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!id || id === 'index') return;
    void (async () => {
      const existing = await getBackend().getLevel(id);
      if (!existing) return;
      setTitle(existing.title);
      setGrid(existing.grid);
      setWinner(existing.winner);
      setHowMany(existing.howMany);
      setColor(existing.color);
      setVisibility(existing.visibility);
      setLevelId(existing.id);
      setCreatedAt(existing.createdAt);
      setWinOptions(existing.winOptions);
      setIndex(existing.index);
    })();
  }, [id]);

  const level: Level = useMemo(
    () => ({
      id: levelId,
      title: title.trim() || 'UNTITLED',
      authorId: user?.uid ?? '',
      authorUsername: user?.username ?? '',
      grid,
      winner,
      howMany,
      color,
      visibility,
      createdAt,
      updatedAt: Date.now(),
      winOptions,
      index,
    }),
    [levelId, title, user, grid, winner, howMany, color, visibility, createdAt, winOptions, index],
  );

  function paint(row: number, col: number) {
    if (tool === 'hint') {
      if (grid[row][col] !== 'empty') return;
      setWinOptions((current) => {
        const exists = current.some((spot) => spot.x === col && spot.y === row);
        return exists
          ? current.filter((spot) => spot.x !== col || spot.y !== row)
          : [...current, { x: col, y: row }];
      });
      return;
    }
    const next = cloneGrid(grid);
    next[row][col] = tool;
    setGrid(next);
    if (tool !== 'empty') {
      setWinOptions((current) => current.filter((spot) => spot.x !== col || spot.y !== row));
    }
  }

  function changeSize(dh: number, dw: number) {
    const h = Math.min(MAX_BOARD, Math.max(MIN_BOARD, heightOf(grid) + dh));
    const w = Math.min(MAX_BOARD, Math.max(MIN_BOARD, widthOf(grid) + dw));
    setGrid(resizeGrid(grid, h, w));
    setWinOptions((current) => current.filter((spot) => spot.x < w && spot.y < h));
  }

  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      await getBackend().saveLevel(level);
      Alert.alert('Saved', `${level.title} stored as ${visibility}.`);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  function test() {
    setPreviewLevel(level);
    router.push('/play/preview');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <IconButton label="✕" onPress={() => router.back()} />
          <Display size={22}>LEVEL CREATION</Display>
          <IconButton
            label="↺"
            onPress={() => {
              setGrid(blankGrid(heightOf(grid), widthOf(grid)));
            }}
          />
        </View>
        <Text style={styles.user}>{user?.username.toUpperCase()}</Text>
        <PanelButton label="TEST LEVEL" onPress={test} />
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="TITLE" placeholderTextColor={colors.muted} />

        <View style={styles.board}>
          <Board
            grid={grid}
            color={color}
            maxSize={340}
            interactive
            onPressCell={paint}
            highlights={winOptions.map((spot) => [spot.y, spot.x])}
          />
        </View>

        <View style={styles.split}>
          <View style={styles.card}>
            <Display size={14}>EDITING</Display>
            <View style={styles.tools}>
              {TOOLS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setTool(item)}
                  style={[styles.tool, tool === item && styles.toolOn]}
                >
                  {item === 'empty' || item === 'wall' ? (
                    <Text style={styles.toolText}>{item === 'wall' ? 'W' : 'E'}</Text>
                  ) : (
                    <Piece cell={item} size={16} />
                  )}
                </Pressable>
              ))}
              <Pressable
                onPress={() => setTool('hint')}
                style={[styles.tool, tool === 'hint' && styles.toolOn]}
              >
                <Text style={styles.toolText}>H</Text>
              </Pressable>
            </View>
            <Body muted>{tool === 'hint' ? `${winOptions.length} HINT CELLS` : 'H MARKS WIN OPTIONS'}</Body>
            <Display size={14}>LEVEL COLOR</Display>
            <View style={styles.tools}>
              {LEVEL_COLORS.map((swatch) => (
                <Pressable
                  key={swatch}
                  onPress={() => setColor(swatch)}
                  style={[styles.swatch, { backgroundColor: swatch }, color === swatch && styles.toolOn]}
                />
              ))}
            </View>
          </View>
          <View style={styles.card}>
            <Display size={14}>WINNER</Display>
            {(['rock', 'paper', 'scissors'] as Rps[]).map((item) => (
              <PanelButton key={item} label={item.toUpperCase()} active={winner === item} onPress={() => setWinner(item)} />
            ))}
            <Display size={14}>HOW MANY</Display>
            <View style={styles.row}>
              <PanelButton label="-" onPress={() => setHowMany((n) => Math.max(1, n - 1))} />
              <Text style={styles.count}>{howMany}</Text>
              <PanelButton label="+" onPress={() => setHowMany((n) => Math.min(8, n + 1))} />
            </View>
            <Body center muted>
              {widthOf(grid)} x {heightOf(grid)}
            </Body>
            <View style={styles.row}>
              <PanelButton label="H-" onPress={() => changeSize(-1, 0)} />
              <PanelButton label="H+" onPress={() => changeSize(1, 0)} />
              <PanelButton label="W-" onPress={() => changeSize(0, -1)} />
              <PanelButton label="W+" onPress={() => changeSize(0, 1)} />
            </View>
          </View>
        </View>

        <Body center>VISIBILITY</Body>
        <View style={styles.row}>
          {(['draft', 'private', 'public'] as Visibility[]).map((item) => (
            <PanelButton key={item} label={item.toUpperCase()} active={visibility === item} onPress={() => setVisibility(item)} />
          ))}
        </View>
        <PanelButton label={busy ? 'SAVING...' : 'SAVE LEVEL'} onPress={save} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 10, paddingBottom: 28 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  user: { color: colors.text, textAlign: 'right', fontFamily: fonts.display },
  input: {
    borderBottomWidth: 1,
    borderColor: colors.text,
    color: colors.text,
    fontFamily: fonts.display,
    paddingVertical: 8,
  },
  board: { alignItems: 'center' },
  split: { flexDirection: 'row', gap: 8 },
  card: {
    flex: 1,
    backgroundColor: '#cfcfcf',
    padding: 8,
    gap: 8,
  },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tool: {
    width: 32,
    height: 32,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#111',
  },
  toolOn: { borderColor: colors.green, borderWidth: 2 },
  toolText: { color: colors.text, fontWeight: '800' },
  swatch: { width: 22, height: 22, borderWidth: 1, borderColor: '#111' },
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  count: { color: '#111', fontFamily: fonts.display, fontSize: 22, minWidth: 28, textAlign: 'center' },
});
