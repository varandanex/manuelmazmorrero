import test from 'node:test';
import { createPlayingGame } from './helpers/game-fixture.js';
import assert from 'node:assert/strict';
import { updateGame, beginBossReveal, beginBossFight, chooseUpgrade, retryFloor, checkpointOf, parseCheckpoint, FLOORS, BOUNDS } from '../src/game.js';
import { MUSIC, CUES } from '../src/audio-config.js';

function saved(floor, version = 2) {
  return { version, floor, perks: Array(floor).fill('power'), score: 2100, elapsed: 123, kills: 20, deaths: 1 };
}
function advance(game, seconds, input = {}) {
  for (let frame = 0; frame < Math.ceil(seconds * 60); frame++) updateGame(game, 1 / 60, input);
}
function wave(floor) {
  const game = createPlayingGame(saved(floor), 42);
  game.phaseTimer = 0; updateGame(game, 1 / 60);
  return game;
}
function boss(floor) {
  const game = createPlayingGame(saved(floor), 42);
  game.phase = 'warning'; game.phaseTimer = 0; updateGame(game, 1 / 60);
  beginBossReveal(game); beginBossFight(game);
  game.enemies.find(enemy => enemy.boss).timer = 0;
  return game;
}

test('five floors retain the original opening and reserve Krakaren for the finale', () => {
  assert.deepEqual(FLOORS.map(floor => floor.name), ['El matadero', 'El jardín podrido', 'La Maraña de Hierro', 'El horno de la furia', 'El plató final']);
  assert.deepEqual(FLOORS.map(floor => floor.boss), ['El Juicer', 'La Acaparadora', 'Humanotauro', 'Elemental de furia', 'Clon de Krakaren']);
});

test('new waves contain the approved species, with finite positions inside the arena', () => {
  for (const floor of [0, 1, 2, 3, 4]) {
    const game = wave(floor);
    for (let index = 0; index < 3; index++) {
      assert.equal(game.enemies.length, FLOORS[floor].waves[index]);
      assert.deepEqual([...new Set(game.enemies.map(enemy => enemy.type))].sort(), [...new Set(FLOORS[floor].formations[index].map(role => FLOORS[floor].mobs[role]))].sort());
      for (const enemy of game.enemies) {
        assert.ok(Number.isFinite(enemy.hp) && enemy.hp > 0);
        assert.ok(enemy.x >= BOUNDS.left && enemy.x <= BOUNDS.right);
        assert.ok(enemy.y >= BOUNDS.top && enemy.y <= BOUNDS.bottom);
      }
      game.enemies = []; advance(game, 1.5);
    }
  }
});

test('legacy checkpoints migrate without losing completed floors or skipping the expansion', () => {
  for (let floor = 0; floor < 3; floor++) {
    const checkpoint = saved(floor, 1), parsed = parseCheckpoint(JSON.stringify(checkpoint));
    assert.deepEqual(parsed, { ...checkpoint, version: 2 });
    assert.equal(createPlayingGame(checkpoint).floor, floor);
  }
  assert.equal(parseCheckpoint(saved(3, 1)), null);
  assert.equal(parseCheckpoint(saved(2, 99)), null);
});

test('new checkpoints resume and retry floors three to five with all earned upgrades', () => {
  for (const floor of [2, 3, 4]) {
    const game = createPlayingGame(saved(floor), 42);
    assert.deepEqual(checkpointOf(game), saved(floor));
    game.mode = 'dead'; game.score += 500; game.kills += 3;
    retryFloor(game);
    assert.equal(game.floor, floor); assert.deepEqual(game.perks, saved(floor).perks);
    assert.equal(game.score, 2100); assert.equal(game.kills, 20); assert.equal(game.deaths, 2);
    assert.equal(game.player.hp, game.player.maxHp); assert.equal(game.stageCheckpoint.version, 2);
  }
  assert.equal(parseCheckpoint(saved(5)), null);
  assert.equal(parseCheckpoint({ ...saved(4), perks: ['power', 'power'] }), null);
});

test('a final-floor upgrade cannot create an unsupported sixth floor', () => {
  const game = createPlayingGame(saved(4)); game.mode = 'upgrade';
  const before = structuredClone(game);
  assert.equal(chooseUpgrade(game, 'power'), false); assert.deepEqual(game, before);
});

test('the Drek closes the gap while the acid crawler fires green projectiles', () => {
  const game = wave(2), drek = game.enemies.find(enemy => enemy.type === 'drek');
  game.enemies = [drek];
  const before = Math.hypot(drek.x - game.player.x, drek.y - game.player.y);
  advance(game, .5);
  assert.ok(Math.hypot(drek.x - game.player.x, drek.y - game.player.y) < before);
  const furnace = wave(3), acid = furnace.enemies.find(enemy => enemy.type === 'acid');
  furnace.enemies = [acid]; acid.timer = 0; updateGame(furnace, 1 / 60);
  assert.equal(furnace.projectiles.length, 1);
  assert.equal(furnace.projectiles[0].color, '#a4d17b');
  assert.equal(furnace.projectiles[0].damage, 10);
});

test('the Jikininki warns before striking and then exposes a recovery window', () => {
  const game = wave(2), enemy = game.enemies.find(enemy => enemy.type === 'jikininki');
  game.enemies = [enemy]; enemy.x = 240; enemy.y = 295; enemy.timer = 0;
  game.player.invulnerable = 0; updateGame(game, 1 / 60);
  assert.equal(enemy.mode, 'windup'); assert.equal(game.hazards[0].type, 'strike');
  const hp = game.player.hp; advance(game, .6); assert.equal(game.player.hp, hp);
  advance(game, .2); assert.equal(enemy.mode, 'recover'); assert.equal(game.player.hp, hp - 13);
  advance(game, 1.2); assert.equal(enemy.mode, 'idle');
});

test('the engineer locks its bulldozer aim and recovers after charging', () => {
  const game = wave(3), enemy = game.enemies.find(enemy => enemy.type === 'engineer');
  game.enemies = [enemy]; enemy.x = 240; enemy.y = 135; enemy.timer = 0;
  updateGame(game, 1 / 60); assert.equal(enemy.mode, 'windup');
  const aim = { ...enemy.aim }; game.player.x += 90;
  advance(game, .5); assert.deepEqual(enemy.aim, aim);
  advance(game, .55); assert.equal(enemy.mode, 'charge'); assert.ok(enemy.y > 135);
  advance(game, 1); assert.equal(enemy.mode, 'recover');
});

test('the humanotaur locks a rail warning, deals no early damage and permits a sidestep', () => {
  for (const dodge of [false, true]) {
    const game = boss(2); game.player.invulnerable = 0; updateGame(game, 1 / 60);
    const rail = game.hazards.find(hazard => hazard.type === 'rail');
    assert.equal(rail.x, game.player.x); assert.ok(rail.delay > 1);
    const hp = game.player.hp;
    advance(game, .5, dodge ? { x: 1 } : {}); assert.equal(game.player.hp, hp);
    assert.equal(rail.x, 240, 'warning does not track the player');
    advance(game, .65);
    assert.equal(game.player.hp, dodge ? hp : hp - 16);
    assert.equal(game.enemies[0].mode, 'recover');
  }
});

test('the rage elemental marks three fire circles before its volley and vulnerability', () => {
  const game = boss(3); game.player.invulnerable = 0; updateGame(game, 1 / 60);
  assert.equal(game.enemies[0].mode, 'windup');
  assert.equal(game.hazards.length, 3); assert.ok(game.hazards.every(h => h.type === 'fire' && h.delay > 1.2));
  const hp = game.player.hp; advance(game, 1.1); assert.equal(game.player.hp, hp);
  advance(game, .25); assert.equal(game.player.hp, hp - 14);
  assert.equal(game.enemies[0].mode, 'recover');
  assert.equal(game.projectiles.length, 3); assert.ok(game.projectiles.every(shot => shot.color === '#ff963f'));
  for (const event of game.events.filter(event => event.type === 'sound')) assert.ok(CUES[event.name], event.name);
});

test('music alternates existing tracks and keeps the finale exclusive to the fifth floor', () => {
  const tracks = FLOORS.map((_, floor) => MUSIC[`floor${floor}`].file);
  assert.deepEqual(tracks, ['Dungeon Showdown.mp3', '毒花迷宫.mp3', 'Dungeon Showdown.mp3', '毒花迷宫.mp3', 'Dungeon Game-Show Finale.mp3']);
  for (let i = 1; i < tracks.length; i++) assert.notEqual(tracks[i], tracks[i - 1]);
  assert.equal(new Set(Object.values(MUSIC).map(track => track.file)).size, 6);
});
