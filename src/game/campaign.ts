import { parseGrid } from './engine';
import type { Level, Rps } from './types';

export type CampaignLevel = Omit<Level, 'authorId' | 'authorUsername' | 'visibility' | 'createdAt' | 'updatedAt'> & {
  blurb: string;
};

function campaign(
  id: string,
  title: string,
  winner: Rps,
  howMany: number,
  color: string,
  ascii: string,
  blurb: string,
): CampaignLevel {
  return {
    id,
    title,
    winner,
    howMany,
    color,
    grid: parseGrid(ascii),
    blurb,
  };
}

export const CAMPAIGN: CampaignLevel[] = [
  campaign(
    'c0',
    'LEVEL 0',
    'rock',
    1,
    '#7CFF4A',
    `
....
....
....
....
`,
    'Place one rock. Watch it fill every empty square.',
  ),
  campaign(
    'c1',
    'LEVEL 1',
    'paper',
    1,
    '#FFD54A',
    `
R.......
.######.
.#......
.#......
.#......
.######.
........
R.......
`,
    'Paper takes rock. The yellow C is a wall — go around it.',
  ),
  campaign(
    'c2',
    'LEVEL 2',
    'scissors',
    1,
    '#E4A15A',
    `
##...##
#..R..#
#.s.s.#
...P...
#.s.s.#
#..r..#
##...##
`,
    'Scissors take paper. Cut a path through the creature.',
  ),
  campaign(
    'c3',
    'LEVEL 3',
    'rock',
    1,
    '#D8EEFF',
    `
sssssss.
ssssssss
ssssssss
ssssssss
ssssssss
ssssssss
ssssssss
ssssssss
ssssssss
Ssssssss
`,
    'No scissors blocks scissors, not rock. Flood the red Xs.',
  ),
  campaign(
    'c4',
    'LEVEL 4',
    'scissors',
    1,
    '#FF6B73',
    `
Sss.....
ssP.....
........
........
........
.....rrr
....PrR.
.....rrr
`,
    'Cages and no-go tiles. Scissors still have to own every playable cell.',
  ),
];

export function getCampaign(id: string): CampaignLevel | undefined {
  return CAMPAIGN.find((level) => level.id === id);
}

export function campaignIndex(id: string): number {
  return CAMPAIGN.findIndex((level) => level.id === id);
}
