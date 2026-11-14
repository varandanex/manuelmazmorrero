import assert from 'node:assert/strict';
import * as before from './before/game.js';
import * as after from '../../src/game.js';
const state = g => JSON.parse(JSON.stringify(g, (key, value) => key === 'events' || key === 'audioLead' ? undefined : value));
let frames = 0;
for (const seed of [1, 42, 299, 91234]) for (let floor = 0; floor < 3; floor++) {
  const checkpoint = { version: 1, floor, perks: Array(floor).fill('power'), score: 0, elapsed: 0, kills: 0, deaths: 0 };
  const a = before.createGame(checkpoint, seed), b = after.createGame(checkpoint, seed);
  for (let frame = 0; frame < 2400; frame++) {
    for (const g of [a, b]) {
      g.player.invulnerable = 100;
      if (frame === 200 || frame === 400) g.enemies = [];
      if (frame === 1600) g.enemies.filter(e => e.boss).forEach(e => { e.hp = e.maxHp / 2; });
    }
    const input = { x: Math.sin(frame / 90), y: Math.cos(frame / 120), attack: frame % 3 === 0, dash: frame % 97 === 0 };
    before.updateGame(a, 1 / 60, input); after.updateGame(b, 1 / 60, input);
    assert.deepEqual(state(b), state(a), `seed ${seed}, floor ${floor}, frame ${frame}`);
    a.events = []; b.events = []; frames++;
  }
}
console.log(`Identical simulation state for ${frames} frames across 4 seeds and all 3 floors (audio events/metadata excluded).`);
