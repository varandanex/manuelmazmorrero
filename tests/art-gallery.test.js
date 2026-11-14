import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { GALLERY_ART, ART_ARCHIVE } from '../src/art-gallery-data.js';
import { galleryIndex, formatArtSize } from '../src/art-gallery.js';
import { createStaticServer } from '../server.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('gallery indexes every original PNG, including older variants, without duplicates', async () => {
  const files = await readdir(new URL('../assets/art/', import.meta.url), { recursive: true });
  const originals = files.filter(file => file.endsWith('.png')).map(file => `/assets/art/${file}`).sort();
  assert.deepEqual(GALLERY_ART.map(item => item.original).sort(), originals);
  assert.equal(new Set(GALLERY_ART.map(item => item.id)).size, GALLERY_ART.length);
  assert.equal(ART_ARCHIVE.count, GALLERY_ART.length);
  assert.equal(GALLERY_ART.filter(item => item.category === 'Jefes').length, 5);
  assert.equal(GALLERY_ART.filter(item => item.category === 'Enemigos').length, 7);
  assert.ok(GALLERY_ART.some(item => item.category === 'Versiones anteriores'));
});

test('catalog size, dimensions and SHA-256 match each unmodified source PNG', async () => {
  for (const item of GALLERY_ART) {
    assert.ok(item.name && item.category); assert.ok(item.original.endsWith(`/${item.filename}`));
    assert.ok(!item.entry.includes('..') && item.entry.startsWith('manolo-ilustraciones/'));
    const bytes = await readFile(new URL(`..${item.original}`, import.meta.url));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(item.width, bytes.readUInt32BE(16)); assert.equal(item.height, bytes.readUInt32BE(20));
    assert.equal(item.bytes, bytes.length); assert.equal(item.sha256, digest(bytes));
    await access(new URL(`..${item.preview}`, import.meta.url));
  }
});

test('ZIP contains all catalog originals byte-for-byte, not converted preview images', async () => {
  const zip = await readFile(new URL(`..${ART_ARCHIVE.url}`, import.meta.url));
  assert.equal(zip.length, ART_ARCHIVE.bytes); assert.equal(digest(zip), ART_ARCHIVE.sha256);
  let offset = 0, count = 0;
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const method = zip.readUInt16LE(offset + 8), size = zip.readUInt32LE(offset + 18);
    const nameSize = zip.readUInt16LE(offset + 26), extraSize = zip.readUInt16LE(offset + 28);
    const name = zip.subarray(offset + 30, offset + 30 + nameSize).toString();
    const item = GALLERY_ART[count]; assert.ok(item, name); assert.equal(name, item.entry);
    assert.equal(method, 0, 'stored original, no recompression'); assert.equal(size, item.bytes);
    const start = offset + 30 + nameSize + extraSize;
    assert.equal(digest(zip.subarray(start, start + size)), item.sha256);
    offset = start + size; count++;
  }
  assert.equal(count, GALLERY_ART.length); assert.equal(zip.readUInt32LE(offset), 0x02014b50);
  const eocd = zip.length - 22;
  assert.equal(zip.readUInt32LE(eocd), 0x06054b50); assert.equal(zip.readUInt16LE(eocd + 10), count);
  assert.equal(zip.readUInt32LE(eocd + 16), offset);
});

test('carousel wraps in both directions and reports the original archive size', () => {
  assert.equal(galleryIndex(0, -1), GALLERY_ART.length - 1);
  assert.equal(galleryIndex(GALLERY_ART.length - 1, 1), 0);
  assert.equal(galleryIndex(0, GALLERY_ART.length * 2 + 3), 3);
  assert.equal(formatArtSize(1048576), '1 MB');
});

test('server provides attachment headers, HEAD and resumable ZIP ranges without exposing other archives', async t => {
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
  for (const url of ['/assets/downloads/private.zip', '/assets/art/gallery.zip', '/scripts/build_art_gallery.py']) assert.equal((await fetch(base + url)).status, 404);
  const png = await fetch(base + GALLERY_ART[0].original + '?download=1');
  assert.equal(png.headers.get('content-type'), 'image/png');
  assert.equal(png.headers.get('content-disposition'), `attachment; filename="${GALLERY_ART[0].filename}"`);
  assert.equal(digest(Buffer.from(await png.arrayBuffer())), GALLERY_ART[0].sha256);
  const preview = await fetch(base + GALLERY_ART[0].preview, { method: 'HEAD' });
  assert.equal(preview.headers.get('content-disposition'), null);
});
