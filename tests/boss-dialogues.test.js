import { test } from 'node:test';
import { createPlayingGame } from './helpers/game-fixture.js';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { BOSS_DIALOGUES } from '../src/boss-dialogues.js';
import { updateGame, beginFloorCombat, beginBossReveal, beginBossFight, damagePlayer, pauseGame, resumeGame, retryFloor, FLOORS } from '../src/game.js';

function pending(floor = 0) {
  const game = createPlayingGame({ version: 2, floor, perks: Array(floor).fill('power'), score: 200, elapsed: 50, kills: 4, deaths: 0 }, 42);
  game.phase = 'warning'; game.phaseTimer = 0; game.events = [];
  updateGame(game, 1 / 60);
  return game;
}

test('each boss has exactly three approved dialogue lines and its own full-body artwork', async () => {
  const approved = [
    ['¿Has venido a una pelea a muerte con un puto paraguas?', 'Me dijeron que aquí llovían hostias.', 'Estupendo: el patrocinador de ataúdes llevaba toda la noche esperando a un idiota así.'],
    ['Todo lo que entra aquí acaba en mi colección.', 'El paraguas no, que luego nadie me lo devuelve.', 'Qué mono: todavía distingue entre sus pertenencias y sus restos.'],
    ['Voy a doblarte en dos, payaso.', 'Empieza por el paraguas, que nunca me cabe en la puta funda.', 'No te preocupes. Cuando termine, vais a caber los dos.'],
    ['¡Voy a reducirte a cenizas!', '¿Puedes empezar por el paraguas? Lleva tres días sin secarse.', 'Claro. Secado rápido y cremación. Todo incluido, gilipollas.'],
    ['Exijo hablar con el responsable de haberte dejado llegar hasta aquí.', 'Está al otro extremo del paraguas; acércate, que te lo presento.', 'Voy a presentar una reclamación con tus dientes grapados.'],
  ];
  assert.equal(BOSS_DIALOGUES.length, 5);
  for (const [floor, intro] of BOSS_DIALOGUES.entries()) {
    assert.deepEqual(intro.lines.map(line => line.text), approved[floor]);
    assert.deepEqual(intro.lines.map(line => line.speaker), ['boss', 'manolo', 'boss']);
    await access(new URL(`../assets/webp/enemies/${intro.art}.webp`, import.meta.url));
  }
});

test('every floor stops before spawning its boss and emits only one introduction', () => {
  for (let floor = 0; floor < FLOORS.length; floor++) {
    const game = pending(floor);
    assert.equal(game.mode, 'boss-intro'); assert.equal(game.phase, 'warning');
    assert.equal(game.enemies.length, 0);
    for (let i = 0; i < 600; i++) updateGame(game, 1 / 60, { attack: true, dash: true });
    assert.deepEqual(game.events, [{ type: 'boss-intro' }]);
  }
});

test('reading freezes clocks, movement, cooldowns, projectiles, hazards and damage', () => {
  const game = pending();
  game.projectiles.push({ x: 240, y: 330, vx: 40, vy: 10, r: 5, life: 4, damage: 10 });
  game.hazards.push({ type: 'pool', x: 240, y: 336, r: 30, life: 4, delay: -1, damage: 10 });
  game.player.attackCooldown = .4; game.player.dashCooldown = 1; game.player.invulnerable = 0;
  const snapshot = structuredClone(game);
  for (let i = 0; i < 600; i++) updateGame(game, 1 / 60, { x: 1, y: 1, attack: true, dash: true });
  assert.equal(damagePlayer(game, 999), false);
  assert.equal(pauseGame(game), false); resumeGame(game);
  assert.deepEqual(game, snapshot);
});

test('explicit acknowledgement spawns the correct boss exactly once', () => {
  for (const [floor, type] of ['butcher', 'spore', 'mantaur', 'elemental', 'host'].entries()) {
    const game = pending(floor), elapsed = game.elapsed, hp = game.player.hp;
    assert.equal(beginBossFight(game), false, 'dialogue alone cannot bypass the reveal');
    assert.equal(beginBossReveal(game), true);
    assert.equal(game.enemies.length, 0);
    assert.equal(beginBossFight(game), true);
    assert.equal(game.mode, 'playing'); assert.equal(game.phase, 'boss');
    assert.equal(game.elapsed, elapsed); assert.equal(game.player.hp, hp);
    assert.deepEqual(game.enemies.filter(enemy => enemy.boss).map(enemy => enemy.type), [type]);
    assert.equal(game.enemies.filter(enemy => enemy.type === 'generator').length, floor === 4 ? 2 : 0);
    const snapshot = structuredClone(game);
    assert.equal(beginBossFight(game), false); assert.deepEqual(game, snapshot);
  }
});

test('other game modes cannot bypass waves or start another boss', () => {
  for (const mode of ['playing', 'paused', 'dead', 'upgrade', 'won', 'floor-intro', 'boss-intro']) {
    const game = createPlayingGame(null, 42); game.mode = mode;
    const snapshot = structuredClone(game);
    assert.equal(beginBossFight(game), false); assert.deepEqual(game, snapshot);
  }
});

test('retrying a floor allows its introduction to play again using the current save format', () => {
  const game = pending(1); beginBossReveal(game); beginBossFight(game); game.mode = 'dead'; retryFloor(game);
  assert.equal(game.phase, 'intro'); assert.equal(game.stageCheckpoint.version, 2);
  assert.deepEqual(game.perks, ['power']);
  beginFloorCombat(game); game.phase = 'warning'; game.phaseTimer = 0; game.events = []; updateGame(game, 1 / 60);
  assert.equal(game.mode, 'boss-intro'); assert.deepEqual(game.events, [{ type: 'boss-intro' }]);
});

test('the new umbrella original has alpha and the delivery sprite is present', async () => {
  const bytes = await readFile(new URL('../assets/art/hero-manu-umbrella.png', import.meta.url));
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  assert.equal(bytes.readUInt32BE(16), 1254); assert.equal(bytes.readUInt32BE(20), 1254);
  assert.ok([4, 6].includes(bytes[25]));
  await access(new URL('../assets/webp/hero-manu-umbrella.webp', import.meta.url));
  await access(new URL('../assets/icons/umbrella-closed.svg', import.meta.url));
});
