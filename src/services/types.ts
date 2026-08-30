import type { Level, UserProfile } from '@/game/types';

export type AuthInput = {
  username: string;
  email: string;
  password: string;
};

export type Backend = {
  kind: 'firebase' | 'local';
  listenAuth: (cb: (user: UserProfile | null) => void) => () => void;
  register: (input: AuthInput) => Promise<UserProfile>;
  login: (emailOrUsername: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  getUser: (uid: string) => Promise<UserProfile | null>;
  listPlayers: (query?: string) => Promise<UserProfile[]>;
  getPlayerByUsername: (username: string) => Promise<UserProfile | null>;
  saveLevel: (level: Level) => Promise<Level>;
  deleteLevel: (id: string) => Promise<void>;
  getLevel: (id: string) => Promise<Level | null>;
  listLevelsForUser: (uid: string, viewerUid: string) => Promise<Level[]>;
  searchPublicLevels: () => Promise<Level[]>;
  markCleared: (uid: string, levelId: string) => Promise<UserProfile>;
};
