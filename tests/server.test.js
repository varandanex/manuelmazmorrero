import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createStaticServer } from '../server.mjs';
async function serve(t) { const server = createStaticServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening'); t.after(() => new Promise(resolve => server.close(resolve))); return `http://127.0.0.1:${server.address().port}`; }

test('victory voucher is delivered as the unmodified original JPEG', async t => {
  const { readFile } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  const original = await readFile(new URL('../assets/rewards/playstation-voucher.jpeg', import.meta.url));
  const base = await serve(t);
  const response = await fetch(`${base}/assets/rewards/playstation-voucher.jpeg`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/jpeg');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), original);
  const stylesheet = await fetch(`${base}/src/victory-reward.css`);
  assert.equal(stylesheet.status, 200);
  assert.equal(stylesheet.headers.get('content-type'), 'text/css; charset=utf-8');
  const page = await (await fetch(base)).text();
  assert.match(page, /href="\/src\/victory-reward\.css"/);
  assert.equal(createHash('sha256').update(original).digest('hex'), '9847b13b083cc997d4f6f899c964531163595dd7035a2fd9fb44979ad86d1971');
});

test('local server delivers real WAV and Unicode/spaced MP3 assets with correct MIME', async t => {
  const base = await serve(t);
  for (const [file, mime] of [['sfx/dash.wav', 'audio/wav'], ['毒花迷宫.mp3', 'audio/mpeg'], ['Welcome to the Dungeon.mp3', 'audio/mpeg']]) {
    const response = await fetch(`${base}/assets/audio/${file.split('/').map(encodeURIComponent).join('/')}`);
    assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), mime);
    assert.ok((await response.arrayBuffer()).byteLength > 1000);
  }
});

test('media supports bounded, open and suffix ranges, rejects unsatisfiable ranges and handles HEAD', async t => {
  const base = await serve(t), url = `${base}/assets/audio/sfx/dash.wav`;
  const full = Buffer.from(await (await fetch(url)).arrayBuffer());
  for (const [range, start, end] of [['bytes=0-15', 0, 15], [`bytes=${full.length - 8}-`, full.length - 8, full.length - 1], ['bytes=-8', full.length - 8, full.length - 1]]) {
    const response = await fetch(url, { headers: { Range: range } });
    assert.equal(response.status, 206); assert.equal(response.headers.get('accept-ranges'), 'bytes');
    assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${full.length}`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), full.subarray(start, end + 1));
  }
  const bad = await fetch(url, { headers: { Range: `bytes=${full.length}-` } });
  assert.equal(bad.status, 416); assert.equal(bad.headers.get('content-range'), `bytes */${full.length}`);
  const head = await fetch(url, { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(head.headers.get('content-length'), String(full.length)); assert.equal((await head.arrayBuffer()).byteLength, 0);
});

test('asset serving does not expose project documents, traversal, malformed paths or symlink targets', async t => {
  const { symlink, unlink } = await import('node:fs/promises');
  const link = new URL('../assets/audio/sfx/escape.wav', import.meta.url);
  await symlink(new URL('../docs/audio-integration/test-contract.md', import.meta.url), link);
  t.after(() => unlink(link));
  const base = await serve(t);
  for (const route of ['/docs/audio-integration/test-contract.md', '/assets/audio/sfx/escape.wav', '/assets/audio/%2e%2e%2f%2e%2e%2fpackage.json', '/assets/audio/%ZZ.mp3', '/assets/audio/missing.mp3']) {
    const response = await fetch(base + route); assert.ok([403, 404].includes(response.status), route); await response.arrayBuffer();
  }
  const post = await fetch(base + '/assets/audio/sfx/dash.wav', { method: 'POST' }); assert.equal(post.status, 405);
});

test('server starts when launched through a versioned-release symlink', { timeout: 5000 }, async t => {
  const { mkdtemp, symlink, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { spawn } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const directory = await mkdtemp(`${tmpdir()}/manolo-launch-`);
  const link = `${directory}/server.mjs`;
  await symlink(fileURLToPath(new URL('../server.mjs', import.meta.url)), link);
  const child = spawn(process.execPath, [link], { env: { ...process.env, HOST: '127.0.0.1', PORT: '0' } });
  t.after(async () => { child.kill(); await rm(directory, { recursive: true, force: true }); });
  const [output] = await once(child.stdout, 'data');
  assert.match(output.toString(), /Manolo el Mazmorrero/);
  assert.equal(child.exitCode, null);
});
