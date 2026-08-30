import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import { documentToLevel, levelToDocument } from '@/game/schema';
import type { Level, UserProfile } from '@/game/types';
import type { AuthInput, Backend } from '@/services/types';

function env(name: string): string {
  return process.env[name] ?? '';
}

export function isFirebaseConfigured(): boolean {
  return Boolean(env('EXPO_PUBLIC_FIREBASE_API_KEY') && env('EXPO_PUBLIC_FIREBASE_PROJECT_ID'));
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function firebaseApp(): FirebaseApp {
  if (app) return app;
  const config = {
    apiKey: env('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: env('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: env('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: env('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('EXPO_PUBLIC_FIREBASE_APP_ID'),
  };
  app = getApps().length ? getApp() : initializeApp(config);
  return app;
}

function firebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(firebaseApp());
  return auth;
}

function firestore(): Firestore {
  if (db) return db;
  db = getFirestore(firebaseApp());
  return db;
}

function asProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    username: String(data.username ?? ''),
    email: String(data.email ?? ''),
    clearedCampaign: Array.isArray(data.clearedCampaign) ? (data.clearedCampaign as string[]) : [],
    clearedLevels: Array.isArray(data.clearedLevels) ? (data.clearedLevels as string[]) : [],
    createdAt: Number(data.createdAt ?? Date.now()),
  };
}

function asLevel(id: string, data: Record<string, unknown>): Level {
  return documentToLevel(id, data);
}

function levelDoc(level: Level) {
  return levelToDocument(level);
}

async function profileFromUid(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(firestore(), 'users', uid));
  if (!snap.exists()) return null;
  return asProfile(uid, snap.data());
}

export const firebaseBackend: Backend = {
  kind: 'firebase',

  listenAuth(cb) {
    return onAuthStateChanged(firebaseAuth(), async (fbUser) => {
      if (!fbUser) {
        cb(null);
        return;
      }
      cb((await profileFromUid(fbUser.uid)) ?? {
        uid: fbUser.uid,
        username: fbUser.displayName ?? 'PLAYER',
        email: fbUser.email ?? '',
        clearedCampaign: [],
        clearedLevels: [],
        createdAt: Date.now(),
      });
    });
  },

  async register(input: AuthInput) {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      throw new Error('Username must be 3-16 letters, numbers, or underscores.');
    }
    const nameKey = username.toLowerCase();
    const taken = await getDoc(doc(firestore(), 'usernames', nameKey));
    if (taken.exists()) throw new Error('That username is taken.');

    const cred = await createUserWithEmailAndPassword(firebaseAuth(), email, input.password);
    const profile: UserProfile = {
      uid: cred.user.uid,
      username,
      email,
      clearedCampaign: [],
      clearedLevels: [],
      createdAt: Date.now(),
    };
    await setDoc(doc(firestore(), 'usernames', nameKey), { uid: cred.user.uid, email });
    await setDoc(doc(firestore(), 'users', cred.user.uid), {
      ...profile,
      usernameLower: nameKey,
    });
    return profile;
  },

  async login(emailOrUsername: string, password: string) {
    let email = emailOrUsername.trim();
    if (!email.includes('@')) {
      const snap = await getDoc(doc(firestore(), 'usernames', email.toLowerCase()));
      if (!snap.exists()) throw new Error('Invalid login.');
      email = String(snap.data().email ?? '');
    }
    const cred = await signInWithEmailAndPassword(firebaseAuth(), email, password);
    const profile = await profileFromUid(cred.user.uid);
    if (!profile) throw new Error('Profile missing. Try registering again.');
    return profile;
  },

  async logout() {
    await signOut(firebaseAuth());
  },

  async getUser(uid: string) {
    return profileFromUid(uid);
  },

  async listPlayers(queryText?: string) {
    const q = queryText?.trim().toLowerCase();
    const ref = collection(firestore(), 'users');
    const snap = q
      ? await getDocs(
          query(
            ref,
            where('usernameLower', '>=', q),
            where('usernameLower', '<=', `${q}\uf8ff`),
            orderBy('usernameLower'),
            limit(50),
          ),
        )
      : await getDocs(query(ref, orderBy('usernameLower'), limit(80)));
    return snap.docs.map((item) => asProfile(item.id, item.data()));
  },

  async getPlayerByUsername(username: string) {
    const snap = await getDoc(doc(firestore(), 'usernames', username.toLowerCase()));
    if (!snap.exists()) return null;
    return profileFromUid(String(snap.data().uid));
  },

  async saveLevel(level: Level) {
    await setDoc(doc(firestore(), 'levels', level.id), levelDoc(level));
    return level;
  },

  async deleteLevel(id: string) {
    await deleteDoc(doc(firestore(), 'levels', id));
  },

  async getLevel(id: string) {
    const snap = await getDoc(doc(firestore(), 'levels', id));
    if (!snap.exists()) return null;
    return asLevel(id, snap.data());
  },

  async listLevelsForUser(uid: string, viewerUid: string) {
    const snap = await getDocs(query(collection(firestore(), 'levels'), where('authorId', '==', uid)));
    return snap.docs
      .map((item) => asLevel(item.id, item.data()))
      .filter((level) => level.authorId === viewerUid || level.visibility === 'public')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async searchPublicLevels() {
    const snap = await getDocs(
      query(collection(firestore(), 'levels'), where('visibility', '==', 'public'), limit(80)),
    );
    return snap.docs.map((item) => asLevel(item.id, item.data()));
  },

  async markCleared(uid: string, levelId: string) {
    const current = await profileFromUid(uid);
    if (!current) throw new Error('User not found');
    const campaign = levelId.startsWith('c');
    const next: UserProfile = {
      ...current,
      clearedCampaign: campaign
        ? Array.from(new Set([...current.clearedCampaign, levelId]))
        : current.clearedCampaign,
      clearedLevels: campaign
        ? current.clearedLevels
        : Array.from(new Set([...current.clearedLevels, levelId])),
    };
    await setDoc(
      doc(firestore(), 'users', uid),
      { ...next, usernameLower: next.username.toLowerCase() },
      { merge: true },
    );
    return next;
  },
};
