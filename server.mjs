import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { createLeaderboard, handleLeaderboard } from './server/leaderboard.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.json': 'application/json', '.zip': 'application/zip' };

export function createStaticServer({ leaderboardFile = process.env.LEADERBOARD_FILE || path.join(root, 'data/leaderboard.json') } = {}) {
const leaderboard = createLeaderboard(leaderboardFile);
return http.createServer(async (req, res) => {
  try {
    if (new URL(req.url, 'http://localhost').pathname === '/api/leaderboard') return await handleLeaderboard(req, res, leaderboard);
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const archiveFile = relative === 'assets/downloads/manolo-fichas-personajes.zip';
    const audioFile = /^assets\/audio\/(?:sfx\/[a-z0-9_]+\.(?:wav|json)|[\p{L}\p{N} _-]+\.mp3)$/u.test(relative);
    if (!archiveFile && !audioFile && !['index.html', 'style.css', 'src/character-cards.css'].includes(relative) && !/^(src|assets)\/[\w/-]+\.(js|png|svg|webp|ico|ttf)$/.test(relative)) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const file = path.resolve(root, relative);
    if (!file.startsWith(root) || await realpath(file) !== path.resolve(await realpath(root), relative)) { res.writeHead(403); res.end(); return; }
    // Stream the large archive; never buffer the entire ZIP for each downloader.
    const data = archiveFile ? null : await readFile(file);
    const size = data ? data.length : (await stat(file)).size;
    const headers = { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Content-Length': size, 'Accept-Ranges': 'bytes' };
    const originalDownload = /^assets\/(?:art|cards)\/[\w/-]+\.png$/.test(relative) && new URL(req.url, 'http://localhost').searchParams.get('download') === '1';
    if (archiveFile || originalDownload) headers['Content-Disposition'] = `attachment; filename="${path.basename(file)}"`;
    const send = (start = 0, end = size - 1) => {
      if (req.method === 'HEAD') { res.end(); return; }
      if (data) { res.end(data.subarray(start, end + 1)); return; }
      const stream = createReadStream(file, { start, end });
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    };
    // Ignore unsupported/multipart ranges and conditional ranges without a validator.
    const range = req.method === 'GET' && !req.headers['if-range'] && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range && (range[1] || range[2])) {
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` }); res.end(); return;
      }
      res.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${size}` });
      send(start, end); return;
    }
    res.writeHead(200, headers);
    send();
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
}

if (process.argv[1] && await realpath(process.argv[1]) === fileURLToPath(import.meta.url)) createStaticServer().listen(port, process.env.HOST || '0.0.0.0', () => {
  console.log(`Manolo el Mazmorrero → http://localhost:${port}`);
  for (const list of Object.values(os.networkInterfaces())) for (const address of list || []) {
    if (address.family === 'IPv4' && !address.internal) console.log(`Same Wi-Fi → http://${address.address}:${port}`);
  }
});
