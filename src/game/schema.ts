import { parseGrid, heightOf, widthOf } from './engine';
import type { Cell, Grid, Level, Rps, Visibility, WinOption } from './types';

/**
 * Numeric cell types used by production RTDB / Firestore level documents.
 *
 * 0 rock, 1 paper, 2 scissors, 3 empty, 4 wall,
 * 5 no-rock, 6 no-paper, 7 no-scissors
 *
 * Inferred from production boards: outer 4s are walls, inner 3s are empty,
 * a 0 is an existing piece, and myType 1 is the winner (paper) the player places.
 * That matches the engine Cell union; nothing in campaign/engine contradicts it.
 */
export const CELL_TYPE = {
  rock: 0,
  paper: 1,
  scissors: 2,
  empty: 3,
  wall: 4,
  'no-rock': 5,
  'no-paper': 6,
  'no-scissors': 7,
} as const satisfies Record<Cell, number>;

export const TYPE_TO_CELL: Record<number, Cell> = {
  0: 'rock',
  1: 'paper',
  2: 'scissors',
  3: 'empty',
  4: 'wall',
  5: 'no-rock',
  6: 'no-paper',
  7: 'no-scissors',
};

export const RPS_TYPE: Record<Rps, number> = {
  rock: 0,
  paper: 1,
  scissors: 2,
};

export const TYPE_TO_RPS: Record<number, Rps> = {
  0: 'rock',
  1: 'paper',
  2: 'scissors',
};

/** 0–1 RGBA floats for the board frame (Firestore / RTDB `borderColor`). */
export type BorderColor = {
  a: number;
  b: number;
  g: number;
  r: number;
};

/** Column-major board: `cols[x].types[y]` is cell (x, y). */
export type LevelMap = {
  cols: Array<{ types: number[] }>;
};

/**
 * Production level document. `map` and `gameMap` use the same column-major
 * encoding. Expo keeps author/visibility timestamps alongside these fields.
 */
export type LevelDocument = {
  amount: number;
  borderColor: BorderColor;
  gameMap: LevelMap;
  index: number;
  map: LevelMap;
  myType: number;
  name: string;
  width: number;
  winOptions: WinOption[];
  authorId: string;
  authorUsername: string;
  visibility: Visibility;
  createdAt: number;
  updatedAt: number;
};

export function cellToType(cell: Cell): number {
  return CELL_TYPE[cell];
}

export function typeToCell(type: number): Cell {
  const cell = TYPE_TO_CELL[type];
  if (!cell) throw new Error(`Unknown cell type ${type}`);
  return cell;
}

export function winnerToType(winner: Rps): number {
  return RPS_TYPE[winner];
}

export function typeToWinner(myType: number): Rps {
  return TYPE_TO_RPS[myType] ?? 'rock';
}

/** Internal row-major `grid[y][x]` → production `cols[x].types[y]`. */
export function gridToMap(grid: Grid): LevelMap {
  const rows = heightOf(grid);
  const cols = widthOf(grid);
  const out: LevelMap['cols'] = [];
  for (let x = 0; x < cols; x += 1) {
    const types: number[] = [];
    for (let y = 0; y < rows; y += 1) {
      types.push(cellToType(grid[y][x]));
    }
    out.push({ types });
  }
  return { cols: out };
}

/** Production `cols[x].types[y]` → internal row-major `grid[y][x]`. */
export function mapToGrid(levelMap: LevelMap): Grid {
  const cols = levelMap.cols ?? [];
  const width = cols.length;
  const height = cols.reduce((max, col) => Math.max(max, col.types?.length ?? 0), 0);
  if (width === 0 || height === 0) throw new Error('Empty level map');
  const grid: Grid = [];
  for (let y = 0; y < height; y += 1) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x += 1) {
      const raw = cols[x]?.types?.[y];
      row.push(raw === undefined ? 'wall' : typeToCell(Number(raw)));
    }
    grid.push(row);
  }
  return grid;
}

export function cloneMap(levelMap: LevelMap): LevelMap {
  return {
    cols: levelMap.cols.map((col) => ({ types: [...(col.types ?? [])] })),
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function byteToHex(value: number): string {
  return Math.round(clamp01(value) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
}

export function hexToBorderColor(hex: string): BorderColor {
  const raw = hex.trim().replace('#', '');
  const n = raw.length === 3 || raw.length === 4 ? raw.replace(/./g, (ch) => ch + ch) : raw;
  const r = Number.parseInt(n.slice(0, 2) || '00', 16) / 255;
  const g = Number.parseInt(n.slice(2, 4) || '00', 16) / 255;
  const b = Number.parseInt(n.slice(4, 6) || '00', 16) / 255;
  const a = n.length >= 8 ? Number.parseInt(n.slice(6, 8), 16) / 255 : 1;
  return { a: clamp01(a), b: clamp01(b), g: clamp01(g), r: clamp01(r) };
}

export function borderColorToHex(color: BorderColor): string {
  const hex = `#${byteToHex(color.r)}${byteToHex(color.g)}${byteToHex(color.b)}`;
  if (clamp01(color.a) < 1) return `${hex}${byteToHex(color.a)}`;
  return hex;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isLevelMap(value: unknown): value is LevelMap {
  if (!isRecord(value) || !Array.isArray(value.cols)) return false;
  return value.cols.every(
    (col) => isRecord(col) && Array.isArray(col.types) && col.types.every((n) => typeof n === 'number'),
  );
}

function parseWinOptions(value: unknown): WinOption[] {
  if (!Array.isArray(value)) return [];
  const out: WinOption[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const x = Number(item.x);
    const y = Number(item.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    out.push({ x, y });
  }
  return out;
}

function parseBorderColor(value: unknown, fallbackHex: string): BorderColor {
  if (isRecord(value)) {
    return {
      a: clamp01(Number(value.a ?? 1)),
      b: clamp01(Number(value.b ?? 0)),
      g: clamp01(Number(value.g ?? 0)),
      r: clamp01(Number(value.r ?? 0)),
    };
  }
  return hexToBorderColor(fallbackHex);
}

function asVisibility(value: unknown): Visibility {
  if (value === 'draft' || value === 'private' || value === 'public') return value;
  return 'public';
}

/** Prefer `map`, then `gameMap`. Both are kept in sync on save. */
export function mapFromDocument(data: Record<string, unknown>): LevelMap {
  if (isLevelMap(data.map)) return data.map;
  if (isLevelMap(data.gameMap)) return data.gameMap;
  throw new Error('Level document is missing map/gameMap');
}

export function levelToDocument(level: Level): LevelDocument {
  const encoded = gridToMap(level.grid);
  return {
    amount: level.howMany,
    borderColor: hexToBorderColor(level.color),
    gameMap: cloneMap(encoded),
    index: level.index,
    map: cloneMap(encoded),
    myType: winnerToType(level.winner),
    name: level.title,
    width: widthOf(level.grid),
    winOptions: level.winOptions.map((spot) => ({ x: spot.x, y: spot.y })),
    authorId: level.authorId,
    authorUsername: level.authorUsername,
    visibility: level.visibility,
    createdAt: level.createdAt,
    updatedAt: level.updatedAt,
  };
}

export function documentToLevel(id: string, data: Record<string, unknown>): Level {
  let grid: Grid;
  try {
    grid = mapToGrid(mapFromDocument(data));
  } catch (error) {
    if (typeof data.grid === 'string') {
      grid = parseGrid(data.grid);
    } else {
      throw error;
    }
  }

  const howMany = Number(data.amount ?? data.howMany ?? 1);
  const winner =
    data.myType !== undefined && data.myType !== null
      ? typeToWinner(Number(data.myType))
      : data.winner === 'rock' || data.winner === 'paper' || data.winner === 'scissors'
        ? data.winner
        : 'rock';
  const border = parseBorderColor(data.borderColor, String(data.color ?? '#7CFF4A'));

  return {
    id,
    title: String(data.name ?? data.title ?? 'UNTITLED'),
    authorId: String(data.authorId ?? ''),
    authorUsername: String(data.authorUsername ?? ''),
    grid,
    winner,
    howMany: Number.isFinite(howMany) ? Math.max(1, Math.min(8, howMany)) : 1,
    color: borderColorToHex(border),
    visibility: asVisibility(data.visibility),
    createdAt: Number(data.createdAt ?? Date.now()),
    updatedAt: Number(data.updatedAt ?? Date.now()),
    winOptions: parseWinOptions(data.winOptions),
    index: Number(data.index ?? 0),
  };
}

export function stringifyLevel(level: Level): string {
  return JSON.stringify(levelToDocument(level));
}

export function parseLevel(id: string, json: string | Record<string, unknown>): Level {
  const data = typeof json === 'string' ? (JSON.parse(json) as Record<string, unknown>) : json;
  return documentToLevel(id, data);
}
