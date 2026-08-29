import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Board } from '@/components/Board';
import { Legend } from '@/components/Legend';
import { Piece } from '@/components/Piece';
import { Body, Display, IconButton, PanelButton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { CAMPAIGN, getCampaign } from '@/game/campaign';
import { cloneGrid, heightOf, playLevel, widthOf } from '@/game/engine';
import type { Grid, Level, SimResult } from '@/game/types';
import { getPreviewLevel } from '@/preview';
import { getBackend } from '@/services';
import { colors, fonts } from '@/theme';

const TICK_MS = 170;

export default function PlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, markCleared } = useAuth();
  const [level, setLevel] = useState<Level | null>(null);
  const [grid, setGrid] = useState<Grid>([]);
  const [spots, setSpots] = useState<Array<[number, number]>>([]);
  const [phase, setPhase] = useState<'place' | 'run' | 'done'>('place');
  const [result, setResult] = useState<SimResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const campaign = id ? getCampaign(id) : undefined;
      if (campaign) {
        const next: Level = {
          ...campaign,
          authorId: 'campaign',
          authorUsername: 'RPS',
          visibility: 'public',
          createdAt: 0,
          updatedAt: 0,
        };
        if (alive) load(next);
        return;
      }
      if (id === 'preview') {
        const preview = getPreviewLevel();
        if (preview && alive) load(preview);
        return;
      }
      if (id) {
        const custom = await getBackend().getLevel(id);
        if (custom && alive) load(custom);
      }
    })();
    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [id]);

  function load(next: Level) {
    if (timer.current) clearInterval(timer.current);
    setLevel({
      ...next,
      winOptions: next.winOptions ?? [],
      index: next.index ?? 0,
    });
    setGrid(cloneGrid(next.grid));
    setSpots([]);
    setPhase('place');
    setResult(null);
    setShowHints(false);
  }

  const remaining = (level?.howMany ?? 1) - spots.length;
  const campaign = Boolean(id && getCampaign(id));

  function tap(row: number, col: number) {
    if (!level || phase !== 'place') return;
    if (grid[row][col] !== 'empty' || remaining <= 0) return;
    const nextSpots: Array<[number, number]> = [...spots, [row, col]];
    const nextGrid = cloneGrid(level.grid);
    for (const [r, c] of nextSpots) nextGrid[r][c] = level.winner;
    setSpots(nextSpots);
    setGrid(nextGrid);
    if (nextSpots.length >= level.howMany) start(level, nextSpots);
  }

  function start(current: Level, placed: Array<[number, number]>) {
    setPhase('run');
    const sim = playLevel(current.grid, current.winner, placed);
    let i = 0;
    setGrid(sim.history[0]);
    timer.current = setInterval(() => {
      i += 1;
      if (i >= sim.history.length) {
        if (timer.current) clearInterval(timer.current);
        setPhase('done');
        setResult(sim.result);
        if (sim.result === 'win' && current.id !== 'preview') {
          void markCleared(current.id);
        }
        return;
      }
      setGrid(sim.history[i]);
    }, TICK_MS);
  }

  function reset() {
    if (level) load(level);
  }

  const title = useMemo(() => {
    if (!level) return 'LEVEL';
    return campaign ? level.title : level.title.toUpperCase();
  }, [campaign, level]);

  if (!level || grid.length === 0) {
    return (
      <Screen>
        <Body center>Loading level...</Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <IconButton label="✕" onPress={() => router.back()} />
          <Text style={styles.user}>{user?.username.toUpperCase()}</Text>
        </View>
        <Display size={28}>INSTRUCTIONS</Display>
        <Display size={22}>{title}</Display>
        <View style={styles.piece}>
          <Piece cell={level.winner} size={22} />
        </View>
        <Body center>
          TAP AN EMPTY SPOT TO PLACE THIS ELEMENT. ONCE PLACED IT HAS TO TAKE OVER THE BOARD. ROCKS,
          PAPERS AND SCISSORS MOVE.
        </Body>
        <Body center muted>
          {phase === 'place'
            ? `PLACE ${remaining} ${level.winner.toUpperCase()}${remaining === 1 ? '' : 'S'}`
            : phase === 'run'
              ? 'TAKING OVER...'
              : result === 'win'
                ? 'BOARD TAKEN'
                : 'FAILED TO TAKE OVER'}
        </Body>

        <View style={styles.board}>
          <Board
            grid={grid}
            color={level.color}
            maxSize={Math.max(widthOf(grid), heightOf(grid)) <= 5 ? 368 : 300}
            interactive={phase === 'place'}
            onPressCell={tap}
            highlights={
              showHints
                ? (level.winOptions ?? []).map((spot) => [spot.y, spot.x] as [number, number])
                : undefined
            }
          />
          <Body center muted>
            {widthOf(grid)} × {heightOf(grid)}
          </Body>
        </View>

        <Display size={16}>ROCK TAKES SCISSORS</Display>
        <Display size={16}>SCISSORS TAKES PAPER</Display>
        <Display size={16}>PAPER TAKES ROCK</Display>
        <Legend />

        {campaign ? (
          <View>
            <Body center>CHOOSE A PRACTICE DIFFICULTY</Body>
            <View style={styles.row}>
              {CAMPAIGN.map((item, index) => (
                <PanelButton
                  key={item.id}
                  label={String(index)}
                  active={item.id === level.id}
                  onPress={() => router.replace(`/play/${item.id}`)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {phase === 'done' ? (
          <View style={styles.row}>
            <PanelButton label="RETRY" onPress={reset} />
            {campaign && result === 'win' ? (
              <PanelButton
                label="NEXT"
                onPress={() => {
                  const index = CAMPAIGN.findIndex((item) => item.id === level.id);
                  const next = CAMPAIGN[index + 1];
                  if (next) router.replace(`/play/${next.id}`);
                  else router.replace('/');
                }}
              />
            ) : null}
          </View>
        ) : null}

        {phase === 'place' && (level.winOptions ?? []).length > 0 ? (
          <PanelButton
            label={showHints ? 'HIDE HINTS' : 'SHOW HINTS'}
            active={showHints}
            onPress={() => setShowHints((value) => !value)}
          />
        ) : null}

        {phase === 'place' && spots.length > 0 ? (
          <Pressable onPress={reset}>
            <Text style={styles.reset}>RESET PLACEMENT</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 10,
    paddingBottom: 24,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  user: {
    color: colors.text,
    fontFamily: fonts.display,
  },
  piece: {
    alignItems: 'center',
  },
  board: {
    alignItems: 'center',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  reset: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },
});
