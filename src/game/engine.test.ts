import assert from 'node:assert/strict';
import { CAMPAIGN } from './campaign';
import {
  canOccupy,
  findWinningPlacements,
  parseGrid,
  playLevel,
  simulate,
  stringifyGrid,
  tick,
} from './engine';

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok  ${name}`);
  } catch (error) {
    console.error(`fail  ${name}`);
    throw error;
  }
}

check('rock cannot enter no-rock', () => {
  assert.equal(canOccupy('rock', 'no-rock'), false);
  assert.equal(canOccupy('paper', 'no-rock'), true);
  assert.equal(canOccupy('scissors', 'no-rock'), true);
});

check('only expand into 4-neighbors', () => {
  const grid = parseGrid(`
R.
..
`);
  const next = tick(grid, 'rock');
  assert.equal(stringifyGrid(next), 'RR\nR.');
});

check('winner expands before other types', () => {
  const grid = parseGrid(`R.P`);
  const next = tick(grid, 'rock');
  // Rock claims the empty cell first, then paper (which beats rock) converts it.
  assert.equal(stringifyGrid(next), 'RPP');
});

check('paper converts no-rock then it is a normal paper cell', () => {
  const grid = parseGrid(`Pr`);
  const next = tick(grid, 'paper');
  assert.equal(stringifyGrid(next), 'PP');
});

check('win requires every non-wall cell to be the winner', () => {
  const sim = simulate(parseGrid(`RR\nR#`), 'rock');
  assert.equal(sim.result, 'win');
});

check('leftover no-X is not a win', () => {
  const sim = simulate(parseGrid(`Rr`), 'rock');
  assert.equal(sim.result, 'lose');
});

check('level 0 any placement wins', () => {
  const level = CAMPAIGN[0];
  const wins = findWinningPlacements(level.grid, level.winner, level.howMany);
  assert.equal(wins.length, 16);
});

for (const level of CAMPAIGN) {
  check(`${level.id} is solvable`, () => {
    const wins = findWinningPlacements(level.grid, level.winner, level.howMany, 5);
    assert.ok(wins.length > 0, `${level.id} has no winning placements`);
    const sim = playLevel(level.grid, level.winner, wins[0]);
    assert.equal(sim.result, 'win');
  });
}

check('howMany 2 places both winner pieces before expanding', () => {
  const grid = parseGrid(`
....
.#.#
....
`);
  const wins = findWinningPlacements(grid, 'rock', 2, 3);
  assert.ok(wins.length > 0);
  assert.equal(wins[0].length, 2);
});

console.log('all tests passed');
