import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CUES, MUSIC } from '../src/audio-config.js';

test('all 31 manifest effects are mapped to real PCM WAVs and all six music files exist', async () => {
  const root = new URL('../assets/audio/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('sfx/manifest.json', root), 'utf8'));
  const mapped = Object.values(CUES).flatMap(cue => cue.files).sort();
  assert.equal(mapped.length, 31); assert.deepEqual(mapped, manifest.sounds.map(sound => sound.file).sort());
  for (const file of mapped) {
    const wav = await readFile(new URL(`sfx/${file}`, root));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF'); assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(wav.readUInt32LE(24), 44100); assert.equal(wav.readUInt16LE(34), 16);
  }
  assert.equal(Object.keys(MUSIC).length, 6);
  for (const track of Object.values(MUSIC)) assert.ok((await readFile(new URL(track.file, root))).length > 100000);
});
