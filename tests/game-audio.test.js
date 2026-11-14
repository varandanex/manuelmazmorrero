import test from 'node:test';
import { createPlayingGame } from './helpers/game-fixture.js';
import assert from 'node:assert/strict';
import { updateGame, damagePlayer, chooseUpgrade, retryFloor, beginFloorCombat, beginBossReveal, beginBossFight } from '../src/game.js';
const sounds = g => g.events.splice(0).filter(e => e.type === 'sound').map(e => e.name);
function arena() { const g = createPlayingGame(null, 42); g.phase = 'boss'; g.events = []; g.player.invulnerable = 0; return g; }
function enemy(type, hp = 100, extra = {}) { return { id: 999, type, x: 240, y: 300, r: 10, hp, maxHp: hp, speed: 0, damage: 0, flash: 0, timer: 100, mode: 'idle', ...extra }; }
function advance(g, frames) { for (let i = 0; i < frames; i++) updateGame(g, 1 / 60); }

test('accepted attacks emit swing plus the actual impact outcome; cooldown input is silent', () => {
  const g = arena(); g.enemies = [enemy('grunt')];
  updateGame(g, 1 / 60, { attack: true });
  assert.deepEqual(sounds(g), ['attack_swing', 'hit_enemy']);
  updateGame(g, 1 / 60, { attack: true }); assert.deepEqual(sounds(g), []);
  g.player.attackCooldown = 0; g.enemies[0].hp = 1;
  updateGame(g, 1 / 60, { attack: true }); assert.deepEqual(sounds(g), ['attack_swing', 'enemy_death']);
  g.player.attackCooldown = 0;
  updateGame(g, 1 / 60, { attack: true }); assert.deepEqual(sounds(g), ['attack_swing']);
  updateGame(g, 1 / 60, { dash: true }); assert.deepEqual(sounds(g), ['dash']);
  updateGame(g, 1 / 60, { dash: true, attack: true }); assert.deepEqual(sounds(g), []);
});

test('shield, generator destruction and recovery hits have distinct outcomes', () => {
  const g = arena(); g.player.y = 140;
  g.enemies = [enemy('host', 450, { y: 111, boss: true, r: 23 }), enemy('generator', 1, { x: 155, y: 193 })];
  updateGame(g, 1 / 60, { attack: true }); assert.deepEqual(sounds(g), ['attack_swing', 'shield_block']);
  g.player.x = 155; g.player.y = 225; g.player.attackCooldown = 0;
  updateGame(g, 1 / 60, { attack: true });
  assert.deepEqual(sounds(g), ['attack_swing', 'generator_destroy', 'shield_break']);
  g.enemies = [enemy('butcher', 100, { boss: true, mode: 'recover' })];
  g.player.x = 240; g.player.y = 336; g.player.attackCooldown = 0;
  updateGame(g, 1 / 60, { attack: true }); assert.deepEqual(sounds(g), ['attack_swing', 'hit_heavy']);
});

test('terminal cues replace ordinary damage/death and floor entry is explicit', () => {
  const g = arena(); damagePlayer(g, 10); assert.deepEqual(sounds(g), ['player_hurt']);
  assert.equal(damagePlayer(g, 10), false); assert.deepEqual(sounds(g), []);
  g.player.invulnerable = 0; damagePlayer(g, 100); assert.deepEqual(sounds(g), ['player_death']);
  retryFloor(g); assert.deepEqual(sounds(g), ['retry']);
  beginFloorCombat(g); assert.deepEqual(sounds(g), ['floor_start']);
  g.enemies = [enemy('butcher', 1, { boss: true })];
  updateGame(g, 1 / 60, { attack: true }); assert.deepEqual(sounds(g), ['attack_swing', 'boss_defeat']);
  chooseUpgrade(g, 'power'); assert.deepEqual(sounds(g), ['upgrade_select']);
  beginFloorCombat(g); assert.deepEqual(sounds(g), ['floor_start']);
  const final = arena(); final.floor = 4; final.enemies = [enemy('host', 1, { boss: true })];
  updateGame(final, 1 / 60, { attack: true }); assert.deepEqual(sounds(final), ['attack_swing', 'victory']);
  assert.deepEqual(sounds(createPlayingGame(null, 42)), ['floor_start']);
});

test('battle does not repeat the reveal sting; butcher attacks sound once per transition', () => {
  const g = arena(); g.phase = 'mobs'; g.wave = 3;
  updateGame(g, 1 / 60); assert.deepEqual(sounds(g), []);
  advance(g, 157); assert.deepEqual(sounds(g), []);
  assert.equal(beginBossReveal(g), true);
  assert.equal(beginBossFight(g), true); assert.deepEqual(sounds(g), []);
  g.enemies[0].timer = 0; updateGame(g, 1 / 60); assert.deepEqual(sounds(g), ['butcher_windup']);
  advance(g, 10); assert.deepEqual(sounds(g), []);
  advance(g, 57); assert.deepEqual(sounds(g), ['butcher_charge']);
  advance(g, 52); assert.deepEqual(sounds(g).filter(n => n !== 'player_hurt'), ['boss_recover']);
});

test('spore volleys share warning and activation cues without per-frame or per-projectile spam', () => {
  const g = arena(); g.player.invulnerable = 100;
  g.enemies = [enemy('spore', 380, { boss: true, y: 100, r: 24, mode: 'windup', timer: 0 })];
  updateGame(g, 1 / 60);
  assert.equal(g.projectiles.length, 5); assert.equal(g.hazards.length, 2);
  assert.deepEqual(sounds(g), ['projectile_cast', 'poison_warning']);
  advance(g, 75); assert.deepEqual(sounds(g), ['poison_activate']);
  advance(g, 15); assert.deepEqual(sounds(g), []);
});

test('host phase change and two-beam volley have one cue each; casters emit cast cues', () => {
  const g = arena(); g.player.invulnerable = 100;
  g.enemies = [enemy('host', 200, { maxHp: 450, boss: true, timer: 0 })];
  updateGame(g, 1 / 60);
  assert.equal(g.hazards.length, 2); assert.equal(g.projectiles.length, 3);
  assert.deepEqual(sounds(g), ['host_phase_two', 'projectile_cast', 'beam_warning']);
  advance(g, 70); assert.deepEqual(sounds(g), ['beam_fire']);
  advance(g, 10); assert.deepEqual(sounds(g), []);
  g.enemies = [enemy('caster', 42, { y: 100, timer: 0 })];
  updateGame(g, 1 / 60); assert.deepEqual(sounds(g), ['projectile_cast']);
});
