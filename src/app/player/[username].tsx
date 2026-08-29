import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Display, IconButton, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import type { Level, UserProfile } from '@/game/types';
import { getBackend } from '@/services';
import { colors, fonts } from '@/theme';

export default function PlayerScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [player, setPlayer] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);

  useEffect(() => {
    void (async () => {
      if (!username || !user) return;
      const backend = getBackend();
      const found = await backend.getPlayerByUsername(username);
      setPlayer(found);
      if (found) setLevels(await backend.listLevelsForUser(found.uid, user.uid));
    })();
  }, [username, user]);

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton label="✕" onPress={() => router.back()} />
        <Display size={24}>{player?.username.toUpperCase() ?? 'PLAYER'}</Display>
        <View style={{ width: 28 }} />
      </View>
      <Body center muted>
        {player
          ? `${player.clearedCampaign.length} CAMPAIGN CLEARS · ${levels.length} LEVELS`
          : 'NOT FOUND'}
      </Body>
      <View style={{ gap: 8, marginTop: 16 }}>
        {levels.map((level) => (
          <Pressable key={level.id} style={styles.item} onPress={() => router.push(`/play/${level.id}`)}>
            <Text style={styles.itemText}>{level.title}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  item: { backgroundColor: colors.panel, padding: 12 },
  itemText: { color: colors.text, fontFamily: fonts.display },
});
