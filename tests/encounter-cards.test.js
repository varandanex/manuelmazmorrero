import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { createGame, beginFloorCombat, beginBossReveal, beginBossFight, updateGame, damagePlayer, pauseGame, resumeGame, chooseUpgrade, retryFloor, checkpointOf, FLOORS } from '../src/game.js';
import { ENCOUNTER_CARDS, FLOOR_BRIEFINGS, floorEnemyCards } from '../src/encounter-cards.js';
import { BOSS_DIALOGUES } from '../src/boss-dialogues.js';
import { createAudio } from '../src/audio.js';
import { browserAudio } from './helpers/audio-browser.js';

function saved(floor) { return { version: 2, floor, perks: Array(floor).fill('power'), score: 100, elapsed: 20, kills: 1, deaths: 0 }; }
function freeze(game) {
  const snapshot = structuredClone(game);
  for (let i = 0; i < 600; i++) updateGame(game, 1 / 60, { x: 1, y: 1, attack: true, dash: true });
  assert.equal(damagePlayer(game, 999), false);
  assert.equal(pauseGame(game), false); resumeGame(game);
  assert.deepEqual(game, snapshot);
}

test('each floor presents only its possible regular enemies, once per species, in wave order', () => {
  for (const floor of FLOORS) {
    const cards = floorEnemyCards(floor);
    assert.deepEqual(cards.map(card => card.type), [...new Set(floor.mobs)]);
    assert.ok(!cards.some(card => card.type === floor.bossType));
    for (const card of cards) for (const key of ['name', 'art', 'tagline', 'attack', 'description', 'tip']) assert.ok(card[key]?.length, `${card.type}.${key}`);
  }
  assert.equal(ENCOUNTER_CARDS.bat.name, 'Desperdigador');
});

test('all floor stories and enemy/boss posters reuse shipped art and consistent boss names', async () => {
  assert.equal(FLOOR_BRIEFINGS.length, FLOORS.length);
  assert.equal(new Set(FLOOR_BRIEFINGS.map(story => story.text)).size, FLOORS.length);
  for (const [index, floor] of FLOORS.entries()) {
    const story = FLOOR_BRIEFINGS[index], boss = ENCOUNTER_CARDS[floor.bossType];
    assert.ok(story.text.length > 150 && story.text.length < 450);
    assert.equal(boss.name, floor.boss); assert.equal(boss.art, BOSS_DIALOGUES[index].art);
    await access(new URL(`../assets/webp/environments/${story.art}.webp`, import.meta.url));
  }
  for (const card of Object.values(ENCOUNTER_CARDS)) await access(new URL(`../assets/webp/enemies/${card.art}.webp`, import.meta.url));
});

test('floor briefings freeze every clock and require acknowledgement before either wave', () => {
  for (let floor = 0; floor < FLOORS.length; floor++) {
    const game = createGame(saved(floor), 42);
    assert.equal(game.mode, 'floor-intro'); assert.equal(game.enemies.length, 0);
    assert.equal(game.events.filter(event => event.type === 'floor-intro').length, 1);
    freeze(game);
    assert.equal(beginFloorCombat(game), true); assert.equal(beginFloorCombat(game), false);
    for (let i = 0; i < 170; i++) updateGame(game, 1 / 60);
    assert.equal(game.phase, 'mobs'); assert.equal(game.enemies.length, FLOORS[floor].waves[0]);
  }
});

test('a dialogue must lead to a frozen reveal before the boss can spawn', () => {
  for (let floor = 0; floor < FLOORS.length; floor++) {
    const game = createGame(saved(floor), 42); beginFloorCombat(game);
    game.phase = 'warning'; game.phaseTimer = 0; updateGame(game, 1 / 60);
    assert.equal(game.mode, 'boss-intro'); assert.equal(beginBossFight(game), false);
    const elapsed = game.elapsed;
    assert.equal(beginBossReveal(game), true); assert.equal(game.mode, 'boss-reveal');
    assert.equal(game.enemies.length, 0); assert.equal(beginBossReveal(game), false);
    freeze(game);
    assert.equal(beginBossFight(game), true); assert.equal(beginBossFight(game), false);
    assert.equal(game.elapsed, elapsed); assert.equal(game.enemies.filter(enemy => enemy.boss).length, 1);
    assert.equal(game.enemies.find(enemy => enemy.boss).type, FLOORS[floor].bossType);
  }
});

test('presentation transitions cannot bypass the wrong mode or phase', () => {
  for (const mode of ['playing', 'paused', 'dead', 'won', 'upgrade']) {
    const game = createGame(null, 42); game.mode = mode;
    assert.equal(beginFloorCombat(game), false); assert.equal(beginBossReveal(game), false); assert.equal(beginBossFight(game), false);
  }
  for (const [mode, action] of [['floor-intro', beginFloorCombat], ['boss-intro', beginBossReveal], ['boss-reveal', beginBossFight]]) {
    const game = createGame(null, 42); game.mode = mode; game.phase = 'mobs';
    assert.equal(action(game), false);
  }
});

test('upgrade, retry and reload return to the floor briefing without changing the save format', () => {
  const game = createGame(null, 42); beginFloorCombat(game); game.mode = 'upgrade';
  chooseUpgrade(game, 'heart'); assert.equal(game.mode, 'floor-intro'); assert.equal(game.floor, 1);
  const checkpoint = checkpointOf(game); assert.equal(checkpoint.version, 2);
  const restored = createGame(checkpoint, 42); assert.equal(restored.mode, 'floor-intro');
  assert.deepEqual(restored.perks, ['heart']); assert.equal(restored.player.hp, 135);
  beginFloorCombat(restored); restored.mode = 'dead'; retryFloor(restored);
  assert.equal(restored.mode, 'floor-intro'); assert.equal(restored.deaths, 1);
});

test('presentation stings work over silent music without allowing combat sounds during reading', async () => {
  const browser = browserAudio(), audio = createAudio(browser.options); await audio.unlock();
  audio.handleEvents([{ type: 'floor' }, { type: 'floor-intro' }], { mode: 'floor-intro', floor: 2 });
  assert.equal(audio.status().paused, true); assert.equal(audio.status().scene, 'floor2');
  assert.equal(browser.media.paused, true); assert.equal(browser.live().length, 0);
  assert.equal(audio.play('attack_swing', true), false);
  for (const [kind, file] of [['enemy', 'hit_heavy.wav'], ['boss', 'boss_intro.wav'], ['floor', 'ui_confirm.wav']]) {
    browser.advance(.5); assert.equal(audio.playPresentation(kind), true);
    assert.ok(browser.sources.at(-1).buffer.id.endsWith(file)); assert.equal(browser.media.paused, true);
  }
  assert.equal(audio.playPresentation('attack_swing'), false);
  audio.setBackground(true); assert.equal(audio.playPresentation('boss'), false); assert.equal(browser.live().length, 0);
  audio.setBackground(false); await audio.setEnabled(false); assert.equal(audio.playPresentation('enemy'), false);
  await audio.setEnabled(true); audio.setPaused(false); assert.equal(browser.media.paused, false);
});
