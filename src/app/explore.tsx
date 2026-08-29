import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Display, IconButton, PanelButton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import type { Level, UserProfile } from '@/game/types';
import { getBackend } from '@/services';
import { colors, fonts } from '@/theme';

export default function ExploreScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [mine, setMine] = useState<Level[]>([]);
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [theirLevels, setTheirLevels] = useState<Level[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const backend = getBackend();
    setMine(await backend.listLevelsForUser(user.uid, user.uid));
    setPlayers(await backend.listPlayers(query));
  }, [user, query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pickPlayer(player: UserProfile) {
    if (!user) return;
    setSelected(player);
    setTheirLevels(await getBackend().listLevelsForUser(player.uid, user.uid));
  }

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton label="✕" onPress={() => router.back()} />
        <Display size={28}>EXPLORE</Display>
        <Text style={styles.user}>{user?.username.toUpperCase()}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Display size={18}>YOUR LEVELS</Display>
        <View style={styles.box}>
          {mine.length === 0 ? (
            <Body center muted>
              {user?.username.toUpperCase()} HAS NOT MADE ANY GAMES
            </Body>
          ) : (
            mine.map((level) => (
              <Pressable
                key={level.id}
                style={styles.level}
                onPress={() => router.push(`/play/${level.id}`)}
                onLongPress={() => router.push(`/create/${level.id}`)}
              >
                <Text style={styles.levelText}>
                  {level.title} · {level.visibility.toUpperCase()}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.searchRow}>
          <TextInput
            placeholder="SEARCH PLAYER"
            placeholderTextColor="#555"
            autoCapitalize="none"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
          />
          <PanelButton label="GO" onPress={() => void load()} />
        </View>

        <View style={styles.split}>
          <View style={{ flex: 1 }}>
            <Display size={16}>PLAYERS</Display>
            <ScrollView style={styles.list}>
              {players.map((player) => (
                <Pressable
                  key={player.uid}
                  onPress={() => void pickPlayer(player)}
                  style={[styles.player, selected?.uid === player.uid && styles.playerOn]}
                >
                  <Text style={styles.playerText}>{player.username.toUpperCase()}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={{ flex: 1 }}>
            <Display size={16}>PLAYER LEVELS</Display>
            <View style={styles.darkBox}>
              {theirLevels.length === 0 ? (
                <Body center muted>
                  {selected ? 'NO PUBLIC LEVELS' : 'SELECT A PLAYER'}
                </Body>
              ) : (
                theirLevels.map((level) => (
                  <Pressable key={level.id} style={styles.levelDark} onPress={() => router.push(`/play/${level.id}`)}>
                    <Text style={styles.levelDarkText}>{level.title}</Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </View>
        <PanelButton label="NEW LEVEL" onPress={() => router.push('/create')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  user: { color: colors.text, fontFamily: fonts.display },
  scroll: { gap: 12, paddingBottom: 24 },
  box: {
    backgroundColor: '#cfcfcf',
    minHeight: 88,
    justifyContent: 'center',
    padding: 8,
    gap: 6,
  },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  search: {
    flex: 1,
    backgroundColor: colors.text,
    color: '#111',
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontFamily: fonts.display,
  },
  split: { flexDirection: 'row', gap: 10, minHeight: 240 },
  list: { maxHeight: 280 },
  player: {
    backgroundColor: colors.text,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#111',
  },
  playerOn: { backgroundColor: '#d7e7ff' },
  playerText: { color: '#111', fontFamily: fonts.display, fontSize: 12 },
  darkBox: { flex: 1, backgroundColor: '#2a2a2a', padding: 8, gap: 6 },
  level: { backgroundColor: '#111', padding: 8 },
  levelText: { color: colors.text, letterSpacing: 0.8 },
  levelDark: { backgroundColor: '#111', padding: 8, borderWidth: 1, borderColor: '#555' },
  levelDarkText: { color: colors.text },
});
