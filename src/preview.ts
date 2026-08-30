import type { Level } from '@/game/types';

let preview: Level | null = null;

export function setPreviewLevel(level: Level | null) {
  preview = level;
}

export function getPreviewLevel(): Level | null {
  return preview;
}
