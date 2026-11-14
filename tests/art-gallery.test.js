import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { CARD_DOWNLOADS, ART_ARCHIVE } from '../src/art-gallery-data.js';
import { characterCards } from '../src/character-cards.js';
import { galleryIndex, formatArtSize } from '../src/art-gallery.js';
import { createStaticServer } from '../server.mjs';
import { createGame, enemyStats, FLOORS } from '../src/game.js';
import { BOSS_DIALOGUES } from '../src/boss-dialogues.js';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const profiles = characterCards();

test('gallery contains only the current full-body Manolo, fifteen enemies and five bosses', () => {
  assert.deepEqual(profiles.map(c => c.id), ['manolo','grunt','rat','bat','wallwatch','caster','woodcutter','drek','jikininki','bramble','acid','engineer','coal','nightweasel','funeral','hobgoblin','butcher','spore','mantaur','elemental','host']);
  assert.deepEqual(CARD_DOWNLOADS.map(item => item.id), profiles.map(c => c.id));
  assert.equal(ART_ARCHIVE.count, 21);
  assert.equal(profiles.filter(p => p.kind === 'hero').length, 1);
  assert.equal(profiles.filter(p => p.kind === 'enemy').length, 15);
  assert.equal(profiles.filter(p => p.kind === 'boss').length, 5);
  assert.equal(profiles[0].original, '/assets/art/hero-manu-umbrella.png');
  assert.ok(profiles.every(p => !/portrait|Manu-0|room|environments|generator/.test(p.original)));
});

test('card stats use simulation values, correct floor ranges and honest movement labels', () => {
  const hero = createGame(null, 1).player;
  assert.equal(profiles[0].stats[0].value, String(hero.hp));
  assert.equal(profiles[0].stats[1].value, String(hero.damage));
  assert.equal(profiles[0].stats[2].value, `${hero.speed} u/s`);
  const goblin = profiles.find(p => p.id === 'grunt');
  assert.deepEqual(goblin.floors, [0]);
  assert.equal(goblin.stats[0].value, '38'); assert.equal(goblin.stats[2].value, '34 u/s');
  for (const profile of profiles.slice(1)) {
    const stats = enemyStats(profile.id, profile.floors[0]);
    assert.equal(profile.stats[1].value, String(stats.damage));
    assert.equal(profile.stats[1].detail, 'Contacto');
    if (profile.id !== 'grunt') assert.equal(profile.stats[0].value, String(stats.hp));
    assert.ok(profile.quote && profile.className && profile.tip && profile.note);
    assert.ok(profile.attacks.every(attack => attack.name && attack.description));
  }
  assert.equal(profiles.find(p => p.id === 'spore').stats[2].value, 'Fija');
  assert.equal(profiles.find(p => p.id === 'host').stats[2].value, 'Patrulla');
  for (const [i, floor] of FLOORS.entries()) assert.equal(profiles.find(p => p.id === floor.bossType).quote, BOSS_DIALOGUES[i].lines[0].text);
});

test('catalog dimensions and SHA-256 match complete high-resolution card PNGs', async () => {
  for (const item of CARD_DOWNLOADS) {
    assert.ok(item.url.endsWith(`/${item.filename}`));
    assert.ok(!item.entry.includes('..') && item.entry.startsWith('manolo-fichas/'));
    const bytes = await readFile(new URL(`..${item.url}`, import.meta.url));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(item.width, 1600); assert.equal(item.height, 2400);
    assert.equal(item.width, bytes.readUInt32BE(16)); assert.equal(item.height, bytes.readUInt32BE(20));
    assert.equal(item.bytes, bytes.length); assert.equal(item.sha256, digest(bytes));
    const profile = profiles.find(p => p.id === item.id);
    await access(new URL(`..${profile.preview}`, import.meta.url)); await access(new URL(`..${profile.original}`, import.meta.url));
  }
});

test('export manifest detects stale copy, stats, artwork, fonts and print styling', async () => {
  const manifest = JSON.parse(await readFile(new URL('../assets/cards/manifest.json', import.meta.url)));
  assert.deepEqual(manifest.cards.map(p => p.id), profiles.map(p => p.id));
  for (const [file, hash] of Object.entries(manifest.sourceHashes)) assert.equal(digest(await readFile(new URL(`../${file}`, import.meta.url))), hash, `Rebuild cards after changing ${file}`);
});

test('ZIP contains exactly the twenty-one complete cards byte-for-byte, with no old art or scenarios', async () => {
  const zip = await readFile(new URL(`..${ART_ARCHIVE.url}`, import.meta.url));
  assert.equal(zip.length, ART_ARCHIVE.bytes); assert.equal(digest(zip), ART_ARCHIVE.sha256);
  let offset = 0, count = 0;
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const method = zip.readUInt16LE(offset + 8), size = zip.readUInt32LE(offset + 18);
    const nameSize = zip.readUInt16LE(offset + 26), extraSize = zip.readUInt16LE(offset + 28);
    const name = zip.subarray(offset + 30, offset + 30 + nameSize).toString();
    const item = CARD_DOWNLOADS[count]; assert.ok(item, name); assert.equal(name, item.entry);
    assert.equal(method, 0); assert.equal(size, item.bytes);
    const start = offset + 30 + nameSize + extraSize;
    assert.equal(digest(zip.subarray(start, start + size)), item.sha256);
    offset = start + size; count++;
  }
  assert.equal(count, 21); assert.equal(zip.readUInt32LE(offset), 0x02014b50);
  const eocd = zip.length - 22;
  assert.equal(zip.readUInt32LE(eocd), 0x06054b50); assert.equal(zip.readUInt16LE(eocd + 10), count);
  assert.equal(zip.readUInt32LE(eocd + 16), offset);
});

test('character carousel wraps in both directions', () => {
  assert.equal(galleryIndex(0, -1), 20); assert.equal(galleryIndex(20, 1), 0);
  assert.equal(galleryIndex(0, 45), 3); assert.equal(formatArtSize(1048576), '1 MB');
});

test('server delivers card/original attachments and resumable ZIP; old all-art download is retired', async t => {
  const server = createStaticServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const head = await fetch(base + ART_ARCHIVE.url, { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(head.headers.get('content-type'), 'application/zip');
  assert.equal(Number(head.headers.get('content-length')), ART_ARCHIVE.bytes);
  assert.equal(head.headers.get('content-disposition'), `attachment; filename="${ART_ARCHIVE.filename}"`);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  const first = await fetch(base + ART_ARCHIVE.url, { headers: { Range: 'bytes=0-31' } });
  assert.equal(first.status, 206); assert.equal(first.headers.get('content-range'), `bytes 0-31/${ART_ARCHIVE.bytes}`);
  assert.equal(Buffer.from(await first.arrayBuffer()).readUInt32LE(0), 0x04034b50);
  const end = await fetch(base + ART_ARCHIVE.url, { headers: { Range: 'bytes=-22' } });
  assert.equal(end.status, 206); assert.equal(Buffer.from(await end.arrayBuffer()).readUInt32LE(0), 0x06054b50);
  const invalid = await fetch(base + ART_ARCHIVE.url, { headers: { Range: `bytes=${ART_ARCHIVE.bytes}-` } });
  assert.equal(invalid.status, 416);
  for (const url of ['/assets/downloads/manolo-ilustraciones-png.zip','/assets/downloads/private.zip','/assets/cards/manifest.json','/scripts/build_character_cards.mjs','/src/private.css']) assert.equal((await fetch(base + url)).status, 404);
  const png = await fetch(base + CARD_DOWNLOADS[0].url + '?download=1');
  assert.equal(png.headers.get('content-type'), 'image/png');
  assert.equal(png.headers.get('content-disposition'), `attachment; filename="${CARD_DOWNLOADS[0].filename}"`);
  assert.equal(digest(Buffer.from(await png.arrayBuffer())), CARD_DOWNLOADS[0].sha256);
  const original = await fetch(base + profiles[0].original + '?download=1');
  assert.equal(original.headers.get('content-disposition'), 'attachment; filename="hero-manu-umbrella.png"');
  assert.equal(digest(Buffer.from(await original.arrayBuffer())), digest(await readFile(new URL(`..${profiles[0].original}`, import.meta.url))));
  const css = await fetch(base + '/src/character-cards.css'); assert.equal(css.status, 200); assert.ok(css.headers.get('content-type').startsWith('text/css'));
});
