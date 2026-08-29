export const MAX_BOARD = 20;
export const MIN_BOARD = 3;

export type Rps = 'rock' | 'paper' | 'scissors';

export type Cell =
  | 'wall'
  | 'empty'
  | Rps
  | 'no-rock'
  | 'no-paper'
  | 'no-scissors';

export type Visibility = 'draft' | 'private' | 'public';

export type SimResult = 'win' | 'lose' | 'cycle' | 'timeout';

export type Grid = Cell[][];

export type Level = {
  id: string;
  title: string;
  authorId: string;
  authorUsername: string;
  grid: Grid;
  winner: Rps;
  howMany: number;
  color: string;
  visibility: Visibility;
  createdAt: number;
  updatedAt: number;
};

export type UserProfile = {
  uid: string;
  username: string;
  email: string;
  clearedCampaign: string[];
  clearedLevels: string[];
  createdAt: number;
};

export const RPS_ORDER: Rps[] = ['rock', 'paper', 'scissors'];

export const BEATS: Record<Rps, Rps> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

export const LOSES_TO: Record<Rps, Rps> = {
  rock: 'paper',
  paper: 'scissors',
  scissors: 'rock',
};

export const NO_CELL: Record<Rps, Cell> = {
  rock: 'no-rock',
  paper: 'no-paper',
  scissors: 'no-scissors',
};

export const CELL_LABELS: Record<Cell, string> = {
  wall: 'WALL',
  empty: 'EMPTY',
  rock: 'ROCK',
  paper: 'PAPER',
  scissors: 'SCISSORS',
  'no-rock': 'NO ROCK',
  'no-paper': 'NO PAPER',
  'no-scissors': 'NO SCISSORS',
};
