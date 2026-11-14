#!/usr/bin/env node
// Optional authoring dependency only; the shipped game and downloads stay static.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, mkdtemp, copyFile, rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createStaticServer } from '../server.mjs';
import { characterCards, CARD_SIZE } from '../src/character-cards.js';
const root = fileURLToPath(new URL('..', import.meta.url)), profiles = characterCards();
let chromium;
try { ({ chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
catch { throw new Error('Card authoring requires Playwright + Chromium. Install them separately or set PLAYWRIGHT_MODULE to an available Playwright ESM module. No dependency is needed to play.'); }
const server = createStaticServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`, temporary = await mkdtemp(path.join(tmpdir(), 'manolo-cards-'));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: CARD_SIZE, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await page.route('**/__card-export', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="es"><meta charset="utf-8"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/src/character-cards.css"><body></body></html>' }));
  await page.goto(`${origin}/__card-export`);
  for (const profile of profiles) {
    await page.evaluate(async id => {
      const { characterCards, createCharacterCard } = await import('/src/character-cards.js');
      document.body.replaceChildren(createCharacterCard(characterCards().find(c => c.id === id), { print: true }));
      await Promise.all([...document.images].map(image => image.decode()));
      await document.fonts.ready;
    }, profile.id);
    const layout = await page.locator('.character-card').evaluate(card => {
      const r = card.getBoundingClientRect();
      return { width: r.width, height: r.height, overflow: card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1,
        clipped: [...card.querySelectorAll('h3,h4,h5,p,blockquote,dl,img,footer')].filter(el => { const b = el.getBoundingClientRect(); return b.left < r.left || b.right > r.right || b.top < r.top || b.bottom > r.bottom; }).map(el => el.className) };
    });
    if (layout.width !== CARD_SIZE.width || layout.height !== CARD_SIZE.height || layout.overflow || layout.clipped.length) throw new Error(`Card ${profile.id} does not fit: ${JSON.stringify(layout)}`);
    await page.locator('.character-card').screenshot({ path: path.join(temporary, `ficha-${profile.id}.png`), animations: 'disabled', scale: 'css' });
    process.stdout.write(`Rendered ${profile.name}\n`);
  }
  const sources = ['style.css', 'src/character-cards.js', 'src/character-cards.css', 'src/game.js', 'src/encounter-cards.js', 'src/boss-dialogues.js', 'scripts/build_character_cards.mjs', ...(await readdir(path.join(root, 'assets/fonts'))).filter(name => name.endsWith('.ttf')).sort().map(name => `assets/fonts/${name}`), ...profiles.map(p => p.original.slice(1))];
  const sourceHashes = Object.fromEntries(await Promise.all(sources.map(async file => [file, createHash('sha256').update(await readFile(path.join(root, file))).digest('hex')])));
  await mkdir(path.join(root, 'assets/cards'), { recursive: true });
  for (const profile of profiles) await copyFile(path.join(temporary, `ficha-${profile.id}.png`), path.join(root, 'assets/cards', `ficha-${profile.id}.png`));
  await writeFile(path.join(root, 'assets/cards/manifest.json'), JSON.stringify({ size: CARD_SIZE, sourceHashes, cards: profiles.map(({ id, name }) => ({ id, name, filename: `ficha-${id}.png` })) }, null, 2) + '\n');
} finally {
  await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(temporary, { recursive: true, force: true });
}
