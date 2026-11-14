import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, PILLARS } from '../src/game.js';
import { loadArt, renderGame, renderPreview } from '../src/render.js';

const themes = ['matadero', 'jardin', 'plato'];

function recordingContext() {
  const draws = [], translations = [];
  const ctx = new Proxy({ canvas: { width: 960, height: 840 } }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'drawImage') return (image, ...geometry) => draws.push({ src: image.src, geometry });
      if (key === 'translate') return (...point) => translations.push(point);
      return () => {};
    },
  });
  return { ctx, draws, translations };
}

async function withArt(callback) {
  const previous = globalThis.Image;
  globalThis.Image = class { naturalWidth = 1254; naturalHeight = 1254; async decode() {} };
  try { await loadArt(); await callback(); }
  finally { globalThis.Image = previous; }
}

test('each floor draws its own room and four matching obstacles without mutating simulation', async () => {
  await withArt(() => {
    themes.forEach((theme, floor) => {
      const game = createGame({ version: 1, floor, perks: Array(floor).fill('power'), score: 0, elapsed: 0, kills: 0, deaths: 0 }, 1);
      const snapshot = structuredClone(game), { ctx, draws, translations } = recordingContext();
      renderGame(ctx, game, 0, true);
      assert.equal(draws[0].src, `/assets/webp/environments/room-${theme}.webp`);
      assert.deepEqual(draws[0].geometry, [0, 0, 480, 420]);
      const obstacles = draws.filter(draw => draw.src.includes('/pillar-'));
      assert.equal(obstacles.length, 4);
      assert.ok(obstacles.every(draw => draw.src.endsWith(`/pillar-${theme}.webp`)));
      assert.ok(obstacles.every(draw => draw.geometry[3] === 48));
      for (const { x, y } of PILLARS) assert.ok(translations.some(point => point[0] === x && point[1] === y));
      assert.deepEqual(game, snapshot);
    });
  });
});

test('the lobby preview uses the redesigned matadero', async () => {
  const previousPath = globalThis.Path2D;
  globalThis.Path2D = class { moveTo() {} lineTo() {} closePath() {} };
  try {
    await withArt(() => {
      const { ctx, draws } = recordingContext(); renderPreview(ctx, 0, true);
      assert.equal(draws[0].src, '/assets/webp/environments/room-matadero.webp');
      assert.equal(draws.filter(draw => draw.src.endsWith('/pillar-matadero.webp')).length, 4);
    });
  } finally { globalThis.Path2D = previousPath; }
});

test('a missing floor or obstacle blocks play instead of showing incomplete scenery', async () => {
  const previous = globalThis.Image;
  try {
    for (const file of ['room-jardin', 'pillar-plato']) {
      globalThis.Image = class { async decode() { if (this.src.endsWith(`/${file}.webp`)) throw new Error('offline'); } };
      await assert.rejects(loadArt(), /Could not load artwork/);
    }
  } finally { globalThis.Image = previous; }
});

test('new room originals preserve arena aspect ratio and obstacles preserve RGBA', async () => {
  const rooms = [];
  for (const theme of themes) {
    const room = await readFile(new URL(`../assets/art/environments/room-${theme}.png`, import.meta.url));
    const pillar = await readFile(new URL(`../assets/art/environments/pillar-${theme}.png`, import.meta.url));
    assert.ok(Math.abs(room.readUInt32BE(16) / room.readUInt32BE(20) - 480 / 420) < .005);
    assert.equal(pillar[25], 6, 'transparent RGBA obstacle');
    assert.equal(pillar.readUInt32BE(16), pillar.readUInt32BE(20));
    rooms.push(room);
  }
  assert.ok(!rooms[0].equals(rooms[1]) && !rooms[1].equals(rooms[2]) && !rooms[0].equals(rooms[2]));
});

test('KYV dedication is present before the main actions and repeated exactly in the footer', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const credit = html.match(/<p class="creator-credit">(.*?)<\/p>/s)[1];
  assert.equal(credit.replace(/<[^>]*>/g, '').trim(), 'UNA AVENTURA HECHA CON ❤️ POR KYV');
  assert.ok(html.indexOf('class="creator-credit"') < html.indexOf('class="entry-actions"'));
  assert.match(html, /<footer class="lobby-footer"><span>UNA AVENTURA HECHA CON ❤️ POR KYV<\/span>/);
  assert.ok(!html.includes('UNA AVENTURA HECHA PARA MANOLO'));
});
