import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function createLeaderboard(file) {
  let pending = Promise.resolve();
  async function read() {
    try {
      const entries = JSON.parse(await readFile(file, 'utf8'));
      if (!Array.isArray(entries)) throw new Error('Invalid leaderboard');
      return entries;
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }
  return {
    async list() { await pending; return read(); },
    submit(entry) {
      const operation = pending.then(async () => {
        const entries = await read();
        if (entries.some(row => row.id === entry.id)) return entries;
        // Stable sort puts a newly submitted tie before all older equal scores.
        const next = [entry, ...entries].sort((a, b) => b.score - a.score).slice(0, 10);
        await mkdir(path.dirname(file), { recursive: true });
        const temporary = `${file}.tmp`;
        await writeFile(temporary, JSON.stringify(next), { mode: 0o600 });
        await rename(temporary, file);
        return next;
      });
      pending = operation.catch(() => {});
      return operation;
    },
  };
}

export async function handleLeaderboard(req, res, store) {
  const send = (status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(value));
  };
  try {
    if (req.method === 'GET') return send(200, { entries: await store.list() });
    if (req.method !== 'POST') return send(405, { error: 'Method not allowed' });
    if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) return send(403, { error: 'Cross-origin submission rejected' });
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return send(415, { error: 'JSON required' });
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 1024) return send(413, { error: 'Submission too large' });
    }
    let entry;
    try { entry = JSON.parse(body); } catch { return send(400, { error: 'Invalid JSON' }); }
    if (!entry || typeof entry.initials !== 'string' || !/^[A-Z0-9]{1,3}$/.test(entry.initials) || !Number.isSafeInteger(entry.score) || entry.score < 0 || entry.score > 1e9 || typeof entry.id !== 'string' || !/^[a-f0-9-]{36}$/.test(entry.id)) return send(400, { error: 'Invalid entry' });
    return send(200, { entries: await store.submit({ id: entry.id, initials: entry.initials, score: entry.score }) });
  } catch { send(503, { error: 'Leaderboard unavailable' }); }
}
