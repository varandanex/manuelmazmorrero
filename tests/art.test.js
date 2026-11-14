import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { loadArt } from '../src/render.js';

const sprites = ['room', 'room-spore', 'room-host', 'hero', 'grunt', 'bat', 'caster', 'butcher', 'spore', 'host', 'generator', 'pillar', 'portrait', 'logo', 'hero-manu', 'hero-manu-umbrella', 'Manu-01-confianza-temeraria', 'Manu-02-caos-absoluto', 'enemies/enemy-goblin', 'enemies/enemy-scatterer', 'enemies/enemy-evil-llama', 'enemies/boss-juicer', 'enemies/boss-hoarder', 'enemies/boss-krakaren'];
for (const theme of ['matadero', 'jardin', 'plato']) {
  sprites.push(`environments/room-${theme}`, `environments/pillar-${theme}`);
}

test('every shipped art asset is a PNG with usable dimensions', async () => {
  for (const name of sprites) {
    const bytes = await readFile(new URL(`../assets/art/${name}.png`, import.meta.url));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG', name);
    assert.ok(bytes.readUInt32BE(16) >= 512, name);
    assert.ok(bytes.readUInt32BE(20) >= 512, name);
  }
});

test('art loader waits for every required asset and reports complete progress', async () => {
  const previous = globalThis.Image;
  const sources = [], progress = [];
  globalThis.Image = class {
    set src(value) { sources.push(value); }
    async decode() {}
  };
  try {
    await loadArt((loaded, total) => progress.push([loaded, total]));
    assert.equal(sources.length, 15);
    assert.ok(sources.includes('/assets/webp/hero-manu-umbrella.webp'));
    assert.ok(!sources.includes('/assets/webp/hero-manu.webp'));
    assert.ok(!sources.includes('/assets/webp/hero.webp'));
    for (const file of ['enemy-goblin', 'enemy-scatterer', 'enemy-evil-llama', 'boss-juicer', 'boss-hoarder', 'boss-krakaren']) assert.ok(sources.includes(`/assets/webp/enemies/${file}.webp`), file);
    assert.ok(sources.includes('/assets/webp/generator.webp'));
    for (const theme of ['matadero', 'jardin', 'plato']) {
      assert.ok(sources.includes(`/assets/webp/environments/room-${theme}.webp`));
      assert.ok(sources.includes(`/assets/webp/environments/pillar-${theme}.webp`));
    }
    for (const previousRoom of ['room', 'room-spore', 'room-host', 'pillar']) {
      assert.ok(!sources.includes(`/assets/webp/${previousRoom}.webp`));
    }
    assert.deepEqual(progress.at(-1), [15, 15]);
    for (const source of sources) await access(new URL(`..${source}`, import.meta.url));
  } finally { globalThis.Image = previous; }
});

test('art loader rejects a missing enemy instead of silently rendering it invisible', async () => {
  const previous = globalThis.Image;
  globalThis.Image = class {
    set src(value) { this.path = value; }
    async decode() { if (this.path.endsWith('/boss-juicer.webp')) throw new Error('offline'); }
  };
  try { await assert.rejects(loadArt(), /Could not load artwork: butcher/); }
  finally { globalThis.Image = previous; }
});


test('every original has a delivery WebP asset', async () => {
  for (const name of sprites) {
    const bytes = await readFile(new URL(`../assets/webp/${name}.webp`, import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF', name);
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP', name);
  }
});

test('late image completions cannot overwrite the loading error message', async () => {
  const previous = globalThis.Image;
  const progress = [];
  globalThis.Image = class {
    set src(value) { this.path = value; }
    async decode() {
      if (this.path.endsWith('/boss-juicer.webp')) throw new Error('offline');
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };
  try {
    await assert.rejects(loadArt(value => progress.push(value)), /butcher/);
    await new Promise(resolve => setTimeout(resolve, 25));
    assert.deepEqual(progress, []);
  } finally { globalThis.Image = previous; }
});
