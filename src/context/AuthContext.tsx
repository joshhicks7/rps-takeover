import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { UserProfile } from '@/game/types';
import { getBackend } from '@/services';
import type { AuthInput } from '@/services/types';

type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  backendKind: 'firebase' | 'local';
  register: (input: AuthInput) => Promise<void>;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  markCleared: (levelId: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const backend = useMemo(() => getBackend(), []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = backend.listenAuth((next) => {
      setUser(next);
      setLoading(false);
    });
    return unsub;
  }, [backend]);

  const value: AuthState = {
    user,
    loading,
    backendKind: backend.kind,
    register: async (input) => {
      setUser(await backend.register(input));
    },
    login: async (emailOrUsername, password) => {
      setUser(await backend.login(emailOrUsername, password));
    },
    logout: () => backend.logout(),
    refresh: async () => {
      if (!user) return;
      setUser((await backend.getUser(user.uid)) ?? user);
    },
    markCleared: async (levelId: string) => {
      if (!user) return;
      setUser(await backend.markCleared(user.uid, levelId));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
