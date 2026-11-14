import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, beginFloorCombat, beginBossReveal, beginBossFight, updateGame, FLOORS, PILLARS, BOUNDS } from '../src/game.js';
import { ENCOUNTER_CARDS } from '../src/encounter-cards.js';
import { characterCards } from '../src/character-cards.js';
import { CUES } from '../src/audio-config.js';
const advance = (g, seconds) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(g, 1 / 60); };
function floorGame(floor, seed = 42) {
  const g = createGame({ version: 2, floor, perks: Array(floor).fill('power'), score: 0, elapsed: 0, kills: 0, deaths: 0 }, seed);
  beginFloorCombat(g); g.player.invulnerable = 999; g.phaseTimer = 0; updateGame(g, 1 / 60); return g;
}
function nextWave(g) { g.enemies = []; updateGame(g, 1 / 60); advance(g, 1.5); }
function isolated(type) {
  const g = floorGame(FLOORS.findIndex(f => f.mobs.includes(type))); nextWave(g);
  const e = g.enemies.find(e => e.type === type); assert.ok(e, type);
  g.enemies = [e]; g.projectiles = []; g.hazards = []; g.events = [];
  Object.assign(e, { x: 240, y: 160, timer: 0, mode: 'idle' });
  return { g, e };
}

test('every floor owns three unique species, illustrations and dossiers, without cross-floor reuse', () => {
  const ids = FLOORS.flatMap(f => f.mobs);
  assert.ok(FLOORS.every(f => f.mobs.length === 3)); assert.equal(new Set(ids).size, 15);
  assert.equal(new Set(ids.map(id => ENCOUNTER_CARDS[id].name)).size, 15);
  assert.equal(new Set(ids.map(id => ENCOUNTER_CARDS[id].art)).size, 15);
  const cards = characterCards().filter(c => c.kind === 'enemy');
  assert.equal(cards.length, 15);
  for (const card of cards) assert.equal(card.floors.length, 1);
});

test('three authored waves grow in count and total health without inflating individual stats', () => {
  assert.deepEqual(FLOORS.map(f => f.waves), [[4, 5, 6], [4, 6, 7], [5, 6, 8], [5, 7, 8], [6, 7, 8]]);
  for (let floor = 0; floor < 5; floor++) {
    const g = floorGame(floor), speciesStats = new Map(); let previousHealth = 0;
    for (let wave = 1; wave <= 3; wave++) {
      assert.equal(g.wave, wave); assert.equal(g.phase, 'mobs'); assert.equal(g.mode, 'playing');
      assert.equal(g.enemies.length, FLOORS[floor].waves[wave - 1]);
      const health = g.enemies.reduce((n, e) => n + e.maxHp, 0); assert.ok(health > previousHealth); previousHealth = health;
      for (const e of g.enemies) {
        const stats = [e.maxHp, e.speed, e.damage];
        if (speciesStats.has(e.type)) assert.deepEqual(stats, speciesStats.get(e.type));
        speciesStats.set(e.type, stats);
      }
      const types = new Set(g.enemies.map(e => e.type));
      assert.equal(types.size, wave === 1 ? 2 : 3);
      assert.ok(g.events.some(e => e.type === 'announcement' && e.text.startsWith(`OLEADA ${wave} / 3`)));
      if (wave < 3) nextWave(g);
    }
    assert.equal(speciesStats.size, 3);
    // Only the third clear may lead to a boss conversation.
    g.enemies = []; updateGame(g, 1 / 60); assert.equal(g.phase, 'warning');
    advance(g, 2.7); assert.equal(g.mode, 'boss-intro');
    assert.equal(beginBossFight(g), false); beginBossReveal(g); beginBossFight(g);
    assert.equal(g.enemies.find(e => e.boss).type, FLOORS[floor].bossType);
  }
});

test('all waves spawn safely even when the player waits at an old spawn position', () => {
  for (let floor = 0; floor < 5; floor++) for (let x = 45; x <= 435; x += 30) for (let y = 80; y <= 365; y += 30) {
    const g = floorGame(floor); g.player.x = x; g.player.y = y;
    for (let wave = 0; wave < 3; wave++) {
      g.wave = wave; g.phase = 'between'; g.phaseTimer = 0; g.enemies = []; g.projectiles = []; g.hazards = [];
      updateGame(g, 1 / 60);
      assert.equal(g.enemies.length, FLOORS[floor].waves[wave]);
      for (const e of g.enemies) {
        assert.ok(Math.hypot(e.x - x, e.y - y) >= 100);
        assert.ok(e.x - e.r >= BOUNDS.left && e.x + e.r <= BOUNDS.right && e.y - e.r >= BOUNDS.top && e.y + e.r <= BOUNDS.bottom);
        assert.ok(PILLARS.every(p => Math.hypot(e.x - p.x, e.y - p.y) > p.r + e.r));
        assert.ok(g.enemies.every(other => other === e || Math.hypot(e.x - other.x, e.y - other.y) >= e.r + other.r));
      }
    }
  }
});

test('rat and night weasel warn, lock their aim and expose recovery after a finite lunge', () => {
  for (const [type, warning] of [['rat', .7], ['nightweasel', .85]]) {
    const { g, e } = isolated(type); updateGame(g, 1 / 60);
    assert.equal(e.mode, 'windup'); const aim = { ...e.aim }, start = { x: e.x, y: e.y };
    g.player.x = 400; advance(g, warning - .1);
    assert.equal(e.mode, 'windup'); assert.deepEqual(e.aim, aim); assert.equal(e.x, start.x); assert.equal(e.y, start.y);
    advance(g, .15); assert.equal(e.mode, 'charge'); assert.deepEqual(e.aim, aim);
    advance(g, .65); assert.equal(e.mode, 'recover'); assert.ok(e.y > start.y);
  }
});

test('bramble and funeral guard telegraph their fixed volleys before any projectile appears', () => {
  for (const [type, delay, count] of [['bramble', 1.1, 3], ['funeral', .9, 1]]) {
    const { g, e } = isolated(type); updateGame(g, 1 / 60); const aim = { ...e.aim };
    g.player.x = 400; advance(g, delay - .1);
    assert.equal(g.projectiles.length, 0); assert.equal(e.mode, 'windup'); assert.deepEqual(e.aim, aim);
    advance(g, .12); assert.equal(e.mode, 'recover'); assert.equal(g.projectiles.length, count);
    assert.ok(g.projectiles.every(p => Number.isFinite(p.vx) && p.vy > 0));
  }
});

test('woodcutter, coal and hobgoblin mark stable areas with no early damage and an escape window', () => {
  for (const [type, delay, damage] of [['woodcutter', .85, 12], ['coal', 1.1, 12], ['hobgoblin', 1.25, 14]]) for (const dodge of [false, true]) {
    const { g, e } = isolated(type); if (type === 'woodcutter') e.y = 310;
    g.player.invulnerable = 0; updateGame(g, 1 / 60); const hp = g.player.hp, h = g.hazards[0];
    assert.ok(h); const position = { x: h.x, y: h.y };
    if (dodge) g.player.x = 400;
    advance(g, delay - .1); assert.equal(g.player.hp, hp); assert.deepEqual({ x: h.x, y: h.y }, position);
    advance(g, .12); assert.equal(g.player.hp, dodge ? hp : hp - damage); assert.equal(e.mode, 'recover');
    assert.ok(g.events.filter(e => e.type === 'sound').every(e => CUES[e.name]));
  }
});

test('the wall watcher approaches on a flank instead of following a straight line', () => {
  const { g, e } = isolated('wallwatch'), initialDistance = Math.hypot(e.x - g.player.x, e.y - g.player.y);
  advance(g, .5); assert.notEqual(e.x, 240); assert.ok(Math.hypot(e.x - g.player.x, e.y - g.player.y) < initialDistance);
});
