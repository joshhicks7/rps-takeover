import AsyncStorage from '@react-native-async-storage/async-storage';

import { stringifyGrid, parseGrid } from '@/game/engine';
import type { Level, UserProfile } from '@/game/types';
import type { AuthInput, Backend } from '@/services/types';

const KEYS = {
  session: 'rps.session',
  users: 'rps.users',
  passwords: 'rps.passwords',
  levels: 'rps.levels',
};

type StoredUser = UserProfile;
type PasswordBook = Record<string, string>;
type StoredLevel = Omit<Level, 'grid'> & { grid: string };

let authListener: ((user: UserProfile | null) => void) | null = null;

function hash(value: string): string {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) h = (h * 33) ^ value.charCodeAt(i);
  return (h >>> 0).toString(16);
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

async function writeJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function validUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,16}$/.test(username.trim());
}

function toLevel(stored: StoredLevel): Level {
  return { ...stored, grid: parseGrid(stored.grid) };
}

function fromLevel(level: Level): StoredLevel {
  return { ...level, grid: stringifyGrid(level.grid) };
}

async function emit(user: UserProfile | null) {
  authListener?.(user);
}

async function users(): Promise<StoredUser[]> {
  return readJson<StoredUser[]>(KEYS.users, []);
}

async function saveUsers(list: StoredUser[]) {
  await writeJson(KEYS.users, list);
}

async function levels(): Promise<StoredLevel[]> {
  return readJson<StoredLevel[]>(KEYS.levels, []);
}

async function saveLevels(list: StoredLevel[]) {
  await writeJson(KEYS.levels, list);
}

async function passwords(): Promise<PasswordBook> {
  return readJson<PasswordBook>(KEYS.passwords, {});
}

function publicView(level: StoredLevel, viewerUid: string): boolean {
  if (level.authorId === viewerUid) return true;
  return level.visibility === 'public';
}

export const localBackend: Backend = {
  kind: 'local',

  listenAuth(cb) {
    authListener = cb;
    void (async () => {
      const uid = await AsyncStorage.getItem(KEYS.session);
      if (!uid) {
        cb(null);
        return;
      }
      const list = await users();
      cb(list.find((user) => user.uid === uid) ?? null);
    })();
    return () => {
      authListener = null;
    };
  },

  async register(input: AuthInput) {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    if (!validUsername(username)) {
      throw new Error('Username must be 3-16 letters, numbers, or underscores.');
    }
    if (!email.includes('@')) throw new Error('Enter a valid email.');
    if (input.password.length < 6) throw new Error('Password must be at least 6 characters.');

    const list = await users();
    if (list.some((user) => normalizeUsername(user.username) === normalizeUsername(username))) {
      throw new Error('That username is taken.');
    }
    if (list.some((user) => user.email === email)) {
      throw new Error('That email is already registered.');
    }

    const profile: UserProfile = {
      uid: `local_${Date.now().toString(36)}`,
      username,
      email,
      clearedCampaign: [],
      clearedLevels: [],
      createdAt: Date.now(),
    };
    const book = await passwords();
    book[email] = hash(input.password);
    book[normalizeUsername(username)] = hash(input.password);
    await writeJson(KEYS.passwords, book);
    await saveUsers([...list, profile]);
    await AsyncStorage.setItem(KEYS.session, profile.uid);
    await emit(profile);
    return profile;
  },

  async login(emailOrUsername: string, password: string) {
    const key = emailOrUsername.includes('@')
      ? emailOrUsername.trim().toLowerCase()
      : normalizeUsername(emailOrUsername);
    const book = await passwords();
    if (!book[key] || book[key] !== hash(password)) {
      throw new Error('Invalid login.');
    }
    const list = await users();
    const profile = list.find(
      (user) => user.email === key || normalizeUsername(user.username) === key,
    );
    if (!profile) throw new Error('Invalid login.');
    await AsyncStorage.setItem(KEYS.session, profile.uid);
    await emit(profile);
    return profile;
  },

  async logout() {
    await AsyncStorage.removeItem(KEYS.session);
    await emit(null);
  },

  async getUser(uid: string) {
    return (await users()).find((user) => user.uid === uid) ?? null;
  },

  async listPlayers(query?: string) {
    const q = normalizeUsername(query ?? '');
    const list = await users();
    return list
      .filter((user) => (q ? normalizeUsername(user.username).includes(q) : true))
      .sort((a, b) => a.username.localeCompare(b.username));
  },

  async getPlayerByUsername(username: string) {
    const key = normalizeUsername(username);
    return (await users()).find((user) => normalizeUsername(user.username) === key) ?? null;
  },

  async saveLevel(level: Level) {
    const list = await levels();
    const stored = fromLevel(level);
    const next = list.filter((item) => item.id !== level.id);
    next.push(stored);
    await saveLevels(next);
    return level;
  },

  async deleteLevel(id: string) {
    await saveLevels((await levels()).filter((level) => level.id !== id));
  },

  async getLevel(id: string) {
    const stored = (await levels()).find((level) => level.id === id);
    return stored ? toLevel(stored) : null;
  },

  async listLevelsForUser(uid: string, viewerUid: string) {
    return (await levels())
      .filter((level) => level.authorId === uid && publicView(level, viewerUid))
      .map(toLevel)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async searchPublicLevels() {
    return (await levels())
      .filter((level) => level.visibility === 'public')
      .map(toLevel)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async markCleared(uid: string, levelId: string) {
    const list = await users();
    const index = list.findIndex((user) => user.uid === uid);
    if (index < 0) throw new Error('User not found');
    const campaign = levelId.startsWith('c');
    const user = list[index];
    const next: UserProfile = {
      ...user,
      clearedCampaign: campaign
        ? Array.from(new Set([...user.clearedCampaign, levelId]))
        : user.clearedCampaign,
      clearedLevels: campaign
        ? user.clearedLevels
        : Array.from(new Set([...user.clearedLevels, levelId])),
    };
    list[index] = next;
    await saveUsers(list);
    await emit(next);
    return next;
  },
};
