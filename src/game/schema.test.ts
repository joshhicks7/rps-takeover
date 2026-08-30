import assert from 'node:assert/strict';

import { CAMPAIGN } from './campaign';
import { heightOf, stringifyGrid, widthOf } from './engine';
import {
  borderColorToHex,
  documentToLevel,
  gridToMap,
  hexToBorderColor,
  levelToDocument,
  mapToGrid,
  typeToCell,
} from './schema';
import type { LevelDocument } from './schema';
import type { Grid } from './types';

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok  ${name}`);
  } catch (error) {
    console.error(`fail  ${name}`);
    throw error;
  }
}

/** Slimmed production sample: 20×20 wall ring, inner empty, one rock (0). */
function productionSample(): Record<string, unknown> {
  const width = 20;
  const pieceX = 9;
  const pieceY = 7;
  const cols: Array<{ types: number[] }> = [];
  for (let x = 0; x < width; x += 1) {
    const types: number[] = [];
    for (let y = 0; y < width; y += 1) {
      if (x === pieceX && y === pieceY) types.push(0);
      else if (x === 0 || y === 0 || x === width - 1 || y === width - 1) types.push(4);
      else types.push(3);
    }
    cols.push({ types });
  }
  const map = { cols };
  return {
    amount: 1,
    borderColor: { a: 1, b: 0, g: 0, r: 1 },
    gameMap: JSON.parse(JSON.stringify(map)),
    index: 0,
    map: JSON.parse(JSON.stringify(map)),
    myType: 1,
    name: '',
    width,
    winOptions: [{ x: 5, y: 13 }],
  };
}

check('ingest production 20x20 sample', () => {
  const raw = JSON.parse(JSON.stringify(productionSample())) as Record<string, unknown>;
  const level = documentToLevel('sample', raw);

  assert.equal(widthOf(level.grid), 20);
  assert.equal(heightOf(level.grid), 20);
  assert.equal(level.howMany, 1);
  assert.equal(level.winner, 'paper');
  assert.equal(level.title, '');
  assert.deepEqual(level.winOptions, [{ x: 5, y: 13 }]);
  assert.equal(level.color, '#FF0000');

  for (let y = 0; y < 20; y += 1) {
    for (let x = 0; x < 20; x += 1) {
      if (x === 9 && y === 7) {
        assert.equal(level.grid[y][x], 'rock', `piece at ${x},${y}`);
      } else if (x === 0 || y === 0 || x === 19 || y === 19) {
        assert.equal(level.grid[y][x], 'wall', `wall at ${x},${y}`);
      } else {
        assert.equal(level.grid[y][x], 'empty', `empty at ${x},${y}`);
      }
    }
  }

  const cols = (raw.map as LevelDocument['map']).cols;
  assert.equal(typeToCell(cols[9].types[7]), 'rock');
  assert.equal(level.grid[7][9], typeToCell(cols[9].types[7]));
});

check('stringify back keeps column-major map and fields', () => {
  const raw = JSON.parse(JSON.stringify(productionSample())) as Record<string, unknown>;
  const level = documentToLevel('sample', raw);
  const doc = levelToDocument(level);

  assert.equal(doc.amount, 1);
  assert.equal(doc.myType, 1);
  assert.equal(doc.width, 20);
  assert.equal(doc.name, '');
  assert.equal(doc.index, 0);
  assert.deepEqual(doc.winOptions, [{ x: 5, y: 13 }]);
  assert.deepEqual(doc.borderColor, { a: 1, b: 0, g: 0, r: 1 });
  assert.deepEqual(doc.map, raw.map);
  assert.deepEqual(doc.gameMap, doc.map);
  assert.equal(doc.map.cols.length, 20);
  assert.equal(doc.map.cols[0].types.length, 20);
  assert.equal(doc.map.cols[9].types[7], 0);
});

check('load map first, fallback to gameMap', () => {
  const raw = productionSample();
  const fromMap = documentToLevel('a', raw);
  const { map: _map, ...withoutMap } = raw;
  const fromGameMap = documentToLevel('b', withoutMap);
  assert.equal(stringifyGrid(fromMap.grid), stringifyGrid(fromGameMap.grid));

  const overridden = productionSample();
  (overridden.map as LevelDocument['map']).cols[4].types[4] = 2;
  const preferred = documentToLevel('c', overridden);
  assert.equal(preferred.grid[4][4], 'scissors');
});

check('column-major cols[x].types[y] is grid[y][x]', () => {
  const grid: Grid = [
    ['wall', 'rock', 'empty'],
    ['paper', 'no-paper', 'scissors'],
  ];
  const encoded = gridToMap(grid);
  assert.deepEqual(encoded.cols[0].types, [4, 1]);
  assert.deepEqual(encoded.cols[1].types, [0, 6]);
  assert.deepEqual(encoded.cols[2].types, [3, 2]);
  assert.deepEqual(mapToGrid(encoded), grid);
});

check('borderColor 0-1 floats round-trip through hex', () => {
  const red = { a: 1, b: 0, g: 0, r: 1 };
  assert.equal(borderColorToHex(red), '#FF0000');
  assert.deepEqual(hexToBorderColor('#FF0000'), red);
  const lime = hexToBorderColor('#7CFF4A');
  assert.equal(borderColorToHex(lime), '#7CFF4A');
});

check('campaign boards convert through the same 0-7 types', () => {
  for (const level of CAMPAIGN) {
    const again = mapToGrid(gridToMap(level.grid));
    assert.equal(stringifyGrid(again), stringifyGrid(level.grid), level.id);
    const doc = levelToDocument({
      ...level,
      authorId: 'campaign',
      authorUsername: 'RPS',
      visibility: 'public',
      createdAt: 0,
      updatedAt: 0,
    });
    assert.equal(doc.myType >= 0 && doc.myType <= 2, true);
    assert.equal(doc.map.cols.length, widthOf(level.grid));
    assert.deepEqual(doc.map, doc.gameMap);
    const loaded = documentToLevel(level.id, doc as unknown as Record<string, unknown>);
    assert.equal(stringifyGrid(loaded.grid), stringifyGrid(level.grid));
    assert.equal(loaded.winner, level.winner);
    assert.equal(loaded.howMany, level.howMany);
  }
});

console.log('all schema tests passed');
