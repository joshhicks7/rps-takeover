import {
  BEATS,
  type Cell,
  type Grid,
  type Rps,
  type SimResult,
  NO_CELL,
  RPS_ORDER,
} from './types';

const DIRS: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function gridKey(grid: Grid): string {
  return grid.map((row) => row.join(',')).join('|');
}

export function heightOf(grid: Grid): number {
  return grid.length;
}

export function widthOf(grid: Grid): number {
  return grid[0]?.length ?? 0;
}

export function isRps(cell: Cell): cell is Rps {
  return cell === 'rock' || cell === 'paper' || cell === 'scissors';
}

export function bannedType(cell: Cell): Rps | null {
  if (cell === 'no-rock') return 'rock';
  if (cell === 'no-paper') return 'paper';
  if (cell === 'no-scissors') return 'scissors';
  return null;
}

/** Can `type` convert/enter this neighbor this tick? */
export function canOccupy(type: Rps, cell: Cell): boolean {
  if (cell === 'wall' || cell === type) return false;
  if (cell === 'empty') return true;
  if (isRps(cell)) return BEATS[type] === cell;
  return bannedType(cell) !== type;
}

export function typeOrder(winner: Rps): Rps[] {
  return [winner, ...RPS_ORDER.filter((t) => t !== winner)];
}

function expandType(grid: Grid, type: Rps): Grid {
  const h = heightOf(grid);
  const w = widthOf(grid);
  const next = cloneGrid(grid);

  for (let r = 0; r < h; r += 1) {
    for (let c = 0; c < w; c += 1) {
      if (grid[r][c] !== type) continue;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= h || nc >= w) continue;
        if (canOccupy(type, grid[nr][nc])) {
          next[nr][nc] = type;
        }
      }
    }
  }

  return next;
}

/** One simultaneous wildfire tick. Winner type expands first. */
export function tick(grid: Grid, winner: Rps): Grid {
  let current = grid;
  for (const type of typeOrder(winner)) {
    current = expandType(current, type);
  }
  return current;
}

export function isWon(grid: Grid, winner: Rps): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (cell === 'wall') continue;
      if (cell !== winner) return false;
    }
  }
  return true;
}

export function emptyCells(grid: Grid): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < heightOf(grid); r += 1) {
    for (let c = 0; c < widthOf(grid); c += 1) {
      if (grid[r][c] === 'empty') cells.push([r, c]);
    }
  }
  return cells;
}

export function place(grid: Grid, spots: Array<[number, number]>, piece: Rps): Grid {
  const next = cloneGrid(grid);
  for (const [r, c] of spots) {
    if (next[r]?.[c] !== 'empty') {
      throw new Error(`Cannot place on ${next[r]?.[c] ?? 'out of bounds'} at ${r},${c}`);
    }
    next[r][c] = piece;
  }
  return next;
}

export type Simulation = {
  history: Grid[];
  result: SimResult;
  ticks: number;
};

export function simulate(grid: Grid, winner: Rps, maxTicks = 400): Simulation {
  const history: Grid[] = [cloneGrid(grid)];
  const seen = new Set<string>([gridKey(grid)]);

  if (isWon(grid, winner)) {
    return { history, result: 'win', ticks: 0 };
  }

  let current = grid;
  for (let i = 0; i < maxTicks; i += 1) {
    const next = tick(current, winner);
    const key = gridKey(next);
    if (key === gridKey(current)) {
      return {
        history,
        result: isWon(next, winner) ? 'win' : 'lose',
        ticks: i,
      };
    }
    history.push(next);
    if (isWon(next, winner)) {
      return { history, result: 'win', ticks: i + 1 };
    }
    if (seen.has(key)) {
      return { history, result: 'cycle', ticks: i + 1 };
    }
    seen.add(key);
    current = next;
  }

  return { history, result: 'timeout', ticks: maxTicks };
}

export function playLevel(
  grid: Grid,
  winner: Rps,
  spots: Array<[number, number]>,
): Simulation {
  return simulate(place(grid, spots, winner), winner);
}

const CHAR_TO_CELL: Record<string, Cell> = {
  '#': 'wall',
  '.': 'empty',
  R: 'rock',
  P: 'paper',
  S: 'scissors',
  r: 'no-rock',
  p: 'no-paper',
  s: 'no-scissors',
};

const CELL_TO_CHAR: Record<Cell, string> = {
  wall: '#',
  empty: '.',
  rock: 'R',
  paper: 'P',
  scissors: 'S',
  'no-rock': 'r',
  'no-paper': 'p',
  'no-scissors': 's',
};

export function parseGrid(ascii: string): Grid {
  const rows = ascii
    .trim()
    .split(/\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  if (rows.length === 0) throw new Error('Empty grid');
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => {
    const padded = row.padEnd(width, '#');
    return padded.split('').map((ch) => {
      const cell = CHAR_TO_CELL[ch];
      if (!cell) throw new Error(`Unknown cell "${ch}"`);
      return cell;
    });
  });
}

export function stringifyGrid(grid: Grid): string {
  return grid.map((row) => row.map((cell) => CELL_TO_CHAR[cell]).join('')).join('\n');
}

export function blankGrid(height: number, width: number, fill: Cell = 'empty'): Grid {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

export function resizeGrid(grid: Grid, height: number, width: number): Grid {
  const next = blankGrid(height, width, 'empty');
  for (let r = 0; r < Math.min(height, heightOf(grid)); r += 1) {
    for (let c = 0; c < Math.min(width, widthOf(grid)); c += 1) {
      next[r][c] = grid[r][c];
    }
  }
  return next;
}

export function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > items.length) return [];
  const out: T[][] = [];
  const rec = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      acc.push(items[i]);
      rec(i + 1, acc);
      acc.pop();
    }
  };
  rec(0, []);
  return out;
}

export function findWinningPlacements(
  grid: Grid,
  winner: Rps,
  howMany: number,
  limit = 80,
): Array<Array<[number, number]>> {
  const cells = emptyCells(grid);
  const wins: Array<Array<[number, number]>> = [];
  for (const spots of combinations(cells, howMany)) {
    const sim = playLevel(grid, winner, spots);
    if (sim.result === 'win') {
      wins.push(spots);
      if (wins.length >= limit) break;
    }
  }
  return wins;
}

export { NO_CELL };
