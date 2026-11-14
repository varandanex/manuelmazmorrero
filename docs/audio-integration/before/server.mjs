import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.ttf': 'font/ttf' };

http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!['index.html', 'style.css'].includes(relative) && !/^(src|assets)\/[\w/-]+\.(js|png|svg|webp|ico|ttf)$/.test(relative)) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const file = path.resolve(root, relative);
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Manolo el Mazmorrero → http://localhost:${port}`);
  for (const list of Object.values(os.networkInterfaces())) for (const address of list || []) {
    if (address.family === 'IPv4' && !address.internal) console.log(`Same Wi-Fi → http://${address.address}:${port}`);
  }
});
