import test from 'node:test';
import { createPlayingGame } from './helpers/game-fixture.js';
import assert from 'node:assert/strict';
import { updateGame, damagePlayer, chooseUpgrade, retryFloor, pauseGame, resumeGame, beginFloorCombat, beginBossReveal, beginBossFight, checkpointOf, parseCheckpoint, BOUNDS, FLOORS, formatTime } from '../src/game.js';

function advance(g, seconds, input = {}) { for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(g, 1 / 60, input); }
function enemy(type, x, y, hp = 10, extra = {}) { return { id: 999, type, x, y, r: 10, hp, maxHp: hp, speed: 0, damage: 0, flash: 0, timer: 100, mode: 'idle', ...extra }; }
function isolated() { const g = createPlayingGame(null, 42); g.phase = 'boss'; g.enemies = []; g.player.invulnerable = 0; return g; }
function reachBoss(g) {
  if (g.mode === 'floor-intro') beginFloorCombat(g);
  advance(g, 2.8);
  g.enemies = []; advance(g, 1.5);
  g.enemies = []; advance(g, 2.8);
  assert.equal(g.mode, 'boss-intro');
  assert.equal(beginBossReveal(g), true);
  assert.equal(beginBossFight(g), true);
  assert.equal(g.phase, 'boss');
  assert.equal(g.enemies.filter(e => e.boss).length, 1);
}

test('a new run starts with full health and a floor announcement', () => {
  const g = createPlayingGame(null, 42); assert.equal(g.floor, 0); assert.equal(g.player.hp, 100); assert.equal(g.mode, 'playing'); assert.equal(g.phase, 'intro');
  assert.ok(g.events.some(e => e.type === 'floor'));
});
test('input vectors are normalized and arena bounds contain the player', () => {
  const a = isolated(), b = isolated(); advance(a, .5, { x: 1 }); advance(b, .5, { x: 1, y: -1 });
  assert.ok(Math.abs(Math.hypot(b.player.x - 240, b.player.y - 336) - (a.player.x - 240)) < .1);
  advance(a, 10, { x: 1, y: 1 }); assert.ok(a.player.x <= BOUNDS.right - a.player.r); assert.ok(a.player.y <= BOUNDS.bottom - a.player.r);
});
test('pause freezes every gameplay clock and health', () => {
  const g = isolated(); pauseGame(g); const snapshot = JSON.stringify(g); advance(g, 4, { x: 1, attack: true, dash: true });
  assert.equal(JSON.stringify(g), snapshot); assert.equal(damagePlayer(g, 100), false); resumeGame(g); assert.equal(g.mode, 'playing');
});
test('attack auto-aims, respects range and awards one kill', () => {
  const g = isolated(); g.enemies = [enemy('grunt', 240, 300), enemy('grunt', 240, 200)];
  updateGame(g, 1 / 60, { attack: true }); assert.equal(g.kills, 1); assert.equal(g.enemies.length, 1); assert.equal(g.score, 50);
  updateGame(g, 1 / 60, { attack: true }); assert.equal(g.kills, 1);
});
test('holding attack respects its cooldown', () => {
  const g = isolated(); g.enemies = [enemy('generator', 240, 300, 500)];
  advance(g, .1, { attack: true }); assert.equal(g.enemies[0].hp, 476);
  advance(g, .4, { attack: true }); assert.equal(g.enemies[0].hp, 452);
});
test('dash avoids damage and cannot be retriggered before recharge', () => {
  const g = isolated(); updateGame(g, 1 / 60, { x: 1, dash: true }); assert.ok(g.player.dashDuration > 0);
  assert.equal(damagePlayer(g, 10), false); advance(g, .5, { dash: true }); assert.equal(g.player.dashDuration, 0);
  assert.equal(g.player.hp, 100); assert.ok(g.player.dashCooldown > 0);
});
test('damage grants invulnerability and transitions to death only once', () => {
  const g = isolated(); assert.equal(damagePlayer(g, 70), true); assert.equal(damagePlayer(g, 70), false);
  advance(g, 1.1); damagePlayer(g, 70); assert.equal(g.mode, 'dead'); assert.equal(g.player.hp, 0);
  damagePlayer(g, 70); assert.equal(g.events.filter(e => e.type === 'dead').length, 1);
});
test('a floor has two waves, a warning and a boss', () => {
  const g = createPlayingGame(null, 42); advance(g, 2.8); assert.equal(g.wave, 1); assert.equal(g.enemies.length, 4);
  g.enemies = []; advance(g, 1.5); assert.equal(g.wave, 2); assert.equal(g.enemies.length, 5);
  g.enemies = []; updateGame(g, 1 / 60); assert.equal(g.phase, 'warning'); advance(g, 2.7); assert.equal(g.mode, 'boss-intro'); assert.equal(g.enemies.length, 0);
  beginBossReveal(g); beginBossFight(g); assert.equal(g.enemies[0].type, 'butcher');
});
test('the butcher locks his charge and exposes a recovery window', () => {
  const g = createPlayingGame(null, 42); reachBoss(g); g.player.invulnerable = 100;
  const boss = g.enemies[0]; boss.timer = 0; updateGame(g, 1 / 60); assert.equal(boss.mode, 'windup');
  const aim = { ...boss.aim }; g.player.x += 90; advance(g, .5); assert.deepEqual(boss.aim, aim);
  advance(g, .65); assert.equal(boss.mode, 'charge'); advance(g, .9); assert.equal(boss.mode, 'recover');
});
test('the spore boss fires projectiles and telegraphs poison pools', () => {
  const g = createPlayingGame({ version: 1, floor: 1, perks: ['power'], score: 0, elapsed: 0, kills: 0, deaths: 0 }, 42); reachBoss(g);
  const boss = g.enemies[0]; boss.timer = 0; advance(g, 1.1); assert.equal(boss.mode, 'recover'); assert.equal(g.projectiles.length, 5);
  assert.equal(g.hazards.length, 2); assert.ok(g.hazards.every(h => h.delay > 0));
});
test('a shielded host takes no damage until generators are destroyed', () => {
  const g = isolated(); g.floor = 4; g.player.x = 240; g.player.y = 140;
  g.enemies = [enemy('host', 240, 111, 450, { boss: true, r: 23 }), enemy('generator', 155, 193, 72)];
  updateGame(g, 1 / 60, { attack: true }); assert.equal(g.enemies[0].hp, 450);
  g.enemies = g.enemies.filter(e => e.type !== 'generator'); g.player.attackCooldown = 0;
  updateGame(g, 1 / 60, { attack: true }); assert.ok(g.enemies[0].hp < 450);
});
test('host restores generators once at half health', () => {
  const g = isolated(); g.floor = 4; g.enemies = [enemy('host', 240, 111, 200, { maxHp: 450, boss: true, r: 23 })];
  updateGame(g, 1 / 60); assert.equal(g.enemies.filter(e => e.type === 'generator').length, 2);
  updateGame(g, 1 / 60); assert.equal(g.enemies.filter(e => e.type === 'generator').length, 2);
});
test('a vulnerable boss takes increased damage', () => {
  const g = isolated(); g.enemies = [enemy('butcher', 240, 300, 340, { boss: true, mode: 'recover', r: 24 })];
  updateGame(g, 1 / 60, { attack: true }); assert.equal(g.enemies[0].hp, 302);
});
test('floor victory opens upgrades and rejects invalid choices', () => {
  const g = isolated(); g.enemies = [enemy('butcher', 240, 300, 1, { boss: true })];
  updateGame(g, 1 / 60, { attack: true }); assert.equal(g.mode, 'upgrade');
  assert.equal(chooseUpgrade(g, 'unknown'), false); assert.equal(chooseUpgrade(g, 'heart'), true);
  assert.equal(g.floor, 1); assert.equal(g.player.hp, 135); assert.equal(g.player.maxHp, 135); assert.equal(g.mode, 'floor-intro');
  assert.equal(chooseUpgrade(g, 'power'), false);
});
test('all five floors can progress through to the final victory', () => {
  const g = createPlayingGame(null, 42);
  for (let floor = 0; floor < FLOORS.length; floor++) {
    reachBoss(g);
    const boss = g.enemies.find(e => e.boss); boss.hp = 1; boss.x = 240; boss.y = 300;
    g.enemies = [boss]; g.player.x = 240; g.player.y = 336; g.player.attackCooldown = 0;
    updateGame(g, 1 / 60, { attack: true });
    if (floor < FLOORS.length - 1) { assert.equal(g.mode, 'upgrade'); chooseUpgrade(g, 'power'); }
    else assert.equal(g.mode, 'won');
  }
  assert.ok(g.events.some(e => e.type === 'won'));
});
test('retry preserves advantages but resets score and kills to the checkpoint', () => {
  const g = isolated(); g.mode = 'upgrade'; chooseUpgrade(g, 'power');
  const baseline = checkpointOf(g); g.score += 400; g.kills += 4; g.player.hp = 0; g.mode = 'dead'; retryFloor(g);
  assert.deepEqual(g.perks, ['power']); assert.equal(g.floor, 1); assert.equal(g.score, baseline.score); assert.equal(g.kills, baseline.kills);
  assert.equal(g.player.hp, g.player.maxHp); assert.equal(g.deaths, 1); assert.equal(g.mode, 'floor-intro');
});
test('checkpoints reject corrupt, unsupported and inconsistent data', () => {
  for (const value of ['', '{}', 'nope', null, { version: 1, floor: 3 }, { version: 1, floor: 0, perks: ['power'] }]) assert.equal(parseCheckpoint(value), null);
  const data = checkpointOf(createPlayingGame(null, 42)); assert.deepEqual(parseCheckpoint(JSON.stringify(data)), data);
  assert.equal(parseCheckpoint({ ...data, elapsed: Infinity }), null);
  assert.equal(parseCheckpoint({ ...data, perks: ['bad'] }), null);
});
test('resume restores a checkpoint at the beginning of its floor', () => {
  const g = isolated(); g.mode = 'upgrade'; chooseUpgrade(g, 'swift'); const checkpoint = checkpointOf(g);
  const resumed = createPlayingGame(checkpoint, 42); assert.equal(resumed.floor, 1); assert.equal(resumed.phase, 'intro'); assert.deepEqual(resumed.perks, ['swift']);
  assert.ok(resumed.player.speed > 116); assert.ok(resumed.player.dashTime < 1.8);
});
test('healing pickups cannot exceed maximum health', () => {
  const g = isolated(); g.player.hp = 99; g.pickups = [{ x: g.player.x, y: g.player.y, life: 10 }]; updateGame(g, 1 / 60);
  assert.equal(g.player.hp, 100); assert.equal(g.pickups.length, 0);
});
test('expired hazards cannot damage the player', () => {
  const g = isolated(); g.hazards = [{ type: 'pool', x: g.player.x, y: g.player.y, r: 30, delay: -1, life: .001, damage: 20 }];
  updateGame(g, 1 / 60); assert.equal(g.player.hp, 100);
});
test('time formatting is stable across minute boundaries', () => {
  assert.equal(formatTime(0), '00:00'); assert.equal(formatTime(59.99), '00:59'); assert.equal(formatTime(60), '01:00');
});
