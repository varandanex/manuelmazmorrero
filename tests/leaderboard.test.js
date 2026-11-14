import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createStaticServer } from '../server.mjs';

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'arcade-ranking-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'scores.json');
  async function start() {
    const server = createStaticServer({ leaderboardFile: file });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    t.after(() => new Promise(resolve => server.close(resolve)));
    return `http://127.0.0.1:${server.address().port}`;
  }
  const base = await start();
  const get = async (url = base) => (await (await fetch(url + '/api/leaderboard')).json()).entries;
  const post = (entry, headers = {}) => fetch(base + '/api/leaderboard', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(entry) });
  return { base, file, start, get, post };
}
const entry = (initials, score) => ({ id: randomUUID(), initials, score });

test('ranking is shared by clients, persists across server restarts and places new ties first', async t => {
  const f = await fixture(t);
  assert.deepEqual(await f.get(), []);
  const old = entry('OLD', 500), newer = entry('NEW', 500);
  assert.equal((await f.post(old)).status, 200);
  assert.equal((await f.post(newer)).status, 200);
  assert.deepEqual((await f.get()).map(row => row.initials), ['NEW', 'OLD']);
  const restarted = await f.start();
  assert.deepEqual(await f.get(restarted), [newer, old]);
  await f.post(old);
  assert.deepEqual(await f.get(), [newer, old], 'retry does not duplicate or reorder a submitted mark');
});

test('concurrent submissions retain exactly the ten best marks and evict the oldest cutoff tie', async t => {
  const f = await fixture(t);
  const submissions = Array.from({ length: 12 }, (_, i) => entry(String(i), i * 100));
  const responses = await Promise.all(submissions.map(value => f.post(value)));
  assert.ok(responses.every(response => response.status === 200));
  assert.deepEqual((await f.get()).map(row => row.score), [1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200]);
  const tie = entry('TIE', 200); await f.post(tie);
  const rows = await f.get(); assert.equal(rows.length, 10); assert.deepEqual(rows.at(-1), tie);
});

test('invalid, oversized and cross-origin entries cannot alter the ranking or expose its file', async t => {
  const f = await fixture(t);
  for (const invalid of [null, entry('<b>', 5), entry('LONG', 5), entry('AAA', -1), entry('AAA', 1.5), entry('AAA', 1e10), { initials: 'AAA', score: 10 }]) {
    assert.equal((await f.post(invalid)).status, 400);
  }
  assert.equal((await f.post(entry('AAA', 10), { Origin: 'https://other.example' })).status, 403);
  assert.equal((await f.post(entry('AAA', 10), { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await f.post(entry('A'.repeat(2000), 10))).status, 413);
  assert.deepEqual(await f.get(), []);
  assert.equal((await fetch(f.base + '/data/leaderboard.json')).status, 404);
  await writeFile(f.file, 'broken');
  assert.equal((await fetch(f.base + '/api/leaderboard')).status, 503);
  assert.equal((await f.post(entry('AAA', 100))).status, 503, 'corrupt data is not overwritten');
});
