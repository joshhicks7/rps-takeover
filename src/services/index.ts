import { localBackend } from '@/services/local';
import { firebaseBackend, isFirebaseConfigured } from '@/services/firebase';
import type { Backend } from '@/services/types';

export function getBackend(): Backend {
  return isFirebaseConfigured() ? firebaseBackend : localBackend;
}

export { isFirebaseConfigured };
