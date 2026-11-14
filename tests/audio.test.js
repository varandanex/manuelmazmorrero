import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';
import { browserAudio } from './helpers/audio-browser.js';

test('audio is opt-in, decodes supplied effects once, and never replays stale loading cues', async () => {
  const browser = browserAudio(), audio = createAudio(browser.options);
  assert.equal(audio.play('dash'), false); assert.equal(browser.contexts, 0); assert.equal(browser.requests.length, 0);
  const ready = audio.setEnabled(true); assert.equal(audio.play('dash'), false);
  await ready;
  assert.equal(browser.contexts, 1); assert.equal(browser.requests.length, 31);
  assert.equal(browser.sources.length, 0);
  assert.equal(audio.play('dash'), true);
  assert.match(browser.sources.at(-1).buffer.id, /sfx\/dash.wav$/);
  await audio.setEnabled(false); assert.equal(browser.live().length, 0); assert.equal(audio.play('dash'), false);
  await audio.setEnabled(true); assert.equal(browser.requests.length, 31);
});

test('each screen selects its supplied music and music/effect sliders control separate buses', async () => {
  const browser = browserAudio(), audio = createAudio(browser.options);
  audio.setScene('floor1'); assert.equal(browser.media.src, '');
  await audio.setEnabled(true);
  assert.equal(decodeURI(browser.media.src), '/assets/audio/毒花迷宫.mp3'); assert.equal(browser.media.loop, true);
  audio.setVolumes({ effects: .2, music: .8 });
  audio.play('dash'); const effectBus = browser.sources.at(-1).target;
  assert.equal(effectBus.gain.value, .2);
  const before = effectBus.gain.value; audio.setVolumes({ music: .3 }); assert.equal(effectBus.gain.value, before);
  for (const [scene, file] of [['lobby', 'Welcome to the Dungeon.mp3'], ['floor0', 'Dungeon Showdown.mp3'], ['floor2', 'Dungeon Game-Show Finale.mp3'], ['upgrade', 'Dungeon Upgrade.mp3'], ['won', 'Victory Fanfare.mp3']]) {
    audio.setScene(scene); assert.equal(decodeURI(browser.media.src), `/assets/audio/${file}`);
  }
  assert.equal(browser.media.loop, false);
  audio.setScene('dead'); assert.equal(browser.media.paused, true);
  assert.deepEqual(audio.status().volumes, { effects: .2, music: .3 });
});

test('pause, background, mute and scene changes stop active effects and preserve music pause position', async () => {
  const browser = browserAudio(), audio = createAudio(browser.options); await audio.setEnabled(true);
  audio.play('beam_warning'); browser.media.currentTime = 12;
  audio.setPaused(true); assert.equal(browser.live().length, 0); assert.equal(browser.media.paused, true);
  assert.equal(audio.play('dash'), false); assert.equal(audio.play('ui_confirm'), true);
  audio.setBackground(true); assert.equal(browser.live().length, 0); assert.equal(audio.play('ui_confirm'), false);
  audio.setBackground(false); assert.equal(browser.media.paused, true);
  audio.setPaused(false); assert.equal(browser.media.paused, false); assert.equal(browser.media.currentTime, 12);
  audio.play('beam_warning'); audio.setScene('floor0'); assert.equal(browser.live().length, 0);
  audio.play('dash'); await audio.setEnabled(false); assert.equal(browser.live().length, 0); assert.equal(browser.media.paused, true);
});

test('impact overlap is capped, danger can interrupt weaker voices, and swing/hit variants rotate', async () => {
  const browser = browserAudio(), audio = createAudio(browser.options); await audio.setEnabled(true);
  for (let i = 0; i < 3; i++) { audio.play('attack_swing'); browser.advance(.5); }
  assert.deepEqual(browser.sources.map(s => s.buffer.id.split('/').at(-1)), ['attack_swing_01.wav', 'attack_swing_02.wav', 'attack_swing_03.wav']);
  audio.setScene('floor0');
  for (let i = 0; i < 10; i++) { audio.play('hit_enemy'); browser.advance(.1); }
  assert.ok(browser.live().length <= 2);
  for (const cue of ['dash', 'projectile_cast', 'heal', 'attack_swing', 'ui_confirm']) { audio.play(cue); browser.advance(.1); }
  assert.ok(browser.live().length <= 6);
  assert.equal(audio.play('player_hurt'), true); assert.ok(browser.live().length <= 6);
  assert.match(browser.live().at(-1).buffer.id, /player_hurt.wav/);
  const count = browser.sources.length; audio.play('player_hurt'); assert.equal(browser.sources.length, count);
});

test('event batches sequence floor entry, select terminal-only cues and cancel pending work on pause', async () => {
  const browser = browserAudio(), audio = createAudio(browser.options); await audio.setEnabled(true);
  const event = name => ({ type: 'sound', name });
  audio.handleEvents([event('upgrade_select'), { type: 'floor' }, event('floor_start')], { mode: 'playing', floor: 1 });
  assert.equal(audio.status().scene, 'floor1'); assert.match(browser.live().at(-1).buffer.id, /upgrade_select.wav/);
  assert.equal(browser.timers.size, 1); browser.advance(.5); browser.flush(); assert.match(browser.live().at(-1).buffer.id, /floor_start.wav/);
  audio.handleEvents([event('retry'), { type: 'floor' }, event('floor_start')], { mode: 'playing', floor: 1 });
  audio.setPaused(true); assert.equal(browser.timers.size, 0); browser.flush(); assert.equal(browser.live().length, 0);
  audio.setPaused(false);
  audio.handleEvents([event('attack_swing'), event('boss_defeat'), event('victory')], { mode: 'won', floor: 2 });
  assert.equal(browser.live().length, 1); assert.match(browser.live()[0].buffer.id, /victory.wav/);
  assert.equal(browser.media.paused, true); browser.advance(1.3); browser.flush(); assert.equal(browser.media.paused, false);
  audio.handleEvents([event('player_hurt'), event('player_death')], { mode: 'dead', floor: 2 });
  assert.equal(browser.live().length, 1); assert.match(browser.live()[0].buffer.id, /player_death.wav/); assert.equal(browser.media.paused, true);
});

test('failed media play is reported, and stale rejection cannot overwrite a newer scene', async () => {
  const browser = browserAudio(); let rejectPlay;
  browser.media.play = () => new Promise((_, reject) => { rejectPlay = reject; });
  const audio = createAudio(browser.options); await audio.setEnabled(true);
  const staleReject = rejectPlay;
  audio.setScene('floor1'); staleReject(new Error('Old failure')); await new Promise(resolve => setImmediate(resolve));
  assert.equal(audio.status().musicError, '');
  rejectPlay(new Error('Autoplay blocked')); await new Promise(resolve => setImmediate(resolve));
  assert.equal(audio.status().musicError, 'playback');
  browser.media.play = () => { browser.media.paused = false; return Promise.resolve(); };
  await audio.unlock(); assert.equal(audio.status().musicError, '');
});

test('failed SFX fetches do not block gameplay or replay late sounds after muting', async () => {
  const browser = browserAudio(); const fetchFile = browser.options.fetchFile;
  browser.options.fetchFile = url => url.endsWith('/dash.wav') ? Promise.resolve({ ok: false }) : fetchFile(url);
  const audio = createAudio(browser.options); const ready = audio.setEnabled(true); await audio.setEnabled(false); await ready;
  assert.equal(audio.status().enabled, false); assert.equal(browser.media.paused, true); assert.equal(browser.sources.length, 0);
  await audio.setEnabled(true); assert.equal(audio.status().ready, true); assert.deepEqual(audio.status().missing, ['dash.wav']);
  assert.equal(audio.play('dash'), false); assert.equal(audio.play('heal'), true);
});

test('delayed floor and victory music never leak into another scene or after mute/background', async () => {
  const browser = browserAudio(), audio = createAudio(browser.options); await audio.setEnabled(true);
  const events = [{ type: 'floor' }, { type: 'sound', name: 'retry' }, { type: 'sound', name: 'floor_start' }];
  for (const stop of [() => audio.setBackground(true), () => audio.setEnabled(false), () => audio.setScene('lobby')]) {
    await audio.setEnabled(true); audio.setBackground(false);
    audio.handleEvents(events, { mode: 'playing', floor: 0 }); assert.equal(browser.timers.size, 1);
    stop(); assert.equal(browser.timers.size, 0); browser.flush(); assert.equal(browser.live().length, 0);
  }
});

test('a finished victory track stays finished until another scene or an explicit restart', async () => {
  const browser = browserAudio(), audio = createAudio(browser.options); await audio.setEnabled(true);
  audio.setScene('won'); browser.media.ended = true; browser.media.paused = true;
  const plays = browser.media.playCount; await audio.unlock(); assert.equal(browser.media.playCount, plays);
  audio.setScene('lobby'); assert.equal(browser.media.playCount, plays + 1);
});
