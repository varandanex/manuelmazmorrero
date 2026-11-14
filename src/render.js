import { WIDTH, HEIGHT, BOUNDS, PILLARS } from './game.js';

// Artwork is separate from simulation. World coordinates and hitboxes stay unchanged.
const ART_NAMES = ['room', 'room-spore', 'room-host', 'hero', 'grunt', 'bat', 'caster', 'butcher', 'spore', 'host', 'generator', 'pillar'];
// Stable simulation roles map to the approved replacement artwork.
const ART_FILES = {
  hero: 'hero-manu-umbrella', grunt: 'enemies/enemy-goblin', bat: 'enemies/enemy-scatterer',
  caster: 'enemies/enemy-evil-llama', butcher: 'enemies/boss-juicer',
  spore: 'enemies/boss-hoarder', host: 'enemies/boss-krakaren',
};
const art = new Map();
const ink = '#0b0b0e', paper = '#f4eddd', yellow = '#ffe000', magenta = '#ed147b';
// Visual sizes only: foot anchors, collision radii and attack ranges are unchanged.
const SPRITE_HEIGHTS = { hero: 78, grunt: 66, bat: 58, caster: 74, butcher: 116, spore: 122, host: 106, generator: 60 };

export async function loadArt(onProgress = () => {}) {
  let loaded = 0;
  let failed = false;
  const sources = [...ART_NAMES.map(name => [name, `/assets/webp/${ART_FILES[name] || name}.webp`]), ['heal', '/assets/icons/first-aid.svg']];
  await Promise.all(sources.map(async ([name, source]) => {
    const image = new Image();
    image.src = source;
    try { await image.decode(); } catch {
      failed = true;
      throw new Error(`Could not load artwork: ${name}`);
    }
    art.set(name, image);
    loaded += 1;
    if (!failed) onProgress(loaded, sources.length);
  }));
}

function sprite(ctx, name, x, y, height, { flip = false, tilt = 0, flash = false } = {}) {
  const image = art.get(name);
  if (!image) return;
  const width = height * image.naturalWidth / image.naturalHeight;
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(flip ? -1 : 1, 1);
  if (flash) ctx.filter = 'brightness(1.8)';
  ctx.drawImage(image, -width / 2, -height + 6, width, height);
  ctx.restore();
}

// Striped telegraphs are gameplay geometry, not decorative scene art.
function dangerZone(ctx, path, waiting, color = magenta) {
  ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = waiting ? .16 : .3; ctx.fill(path);
  ctx.globalAlpha = waiting ? .7 : .9; ctx.strokeStyle = color; ctx.lineWidth = waiting ? 1.5 : 2.5;
  ctx.setLineDash(waiting ? [5, 4] : []); ctx.stroke(path); ctx.setLineDash([]);
  ctx.clip(path); ctx.globalAlpha = waiting ? .3 : .5; ctx.lineWidth = 5;
  for (let x = -HEIGHT; x < WIDTH + HEIGHT; x += 16) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + HEIGHT, HEIGHT); ctx.stroke();
  }
  ctx.restore();
}

function drawEnemy(ctx, e, time, game) {
  if (e.type === 'butcher' && e.mode === 'windup' && e.aim) {
    const half = e.r + game.player.r;
    const nx = -e.aim.y * half, ny = e.aim.x * half;
    const path = new Path2D();
    path.moveTo(e.x + nx, e.y + ny); path.lineTo(e.x + nx + e.aim.x * 350, e.y + ny + e.aim.y * 350);
    path.lineTo(e.x - nx + e.aim.x * 350, e.y - ny + e.aim.y * 350); path.lineTo(e.x - nx, e.y - ny); path.closePath();
    ctx.save(); ctx.beginPath(); ctx.rect(BOUNDS.left, BOUNDS.top, BOUNDS.right - BOUNDS.left, BOUNDS.bottom - BOUNDS.top); ctx.clip();
    dangerZone(ctx, path, true); ctx.restore();
  }
  if (e.boss && e.mode === 'windup') {
    ctx.strokeStyle = yellow; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r + 5, (e.r + 5) * .45, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  // Keep taller bosses fully visible when they approach the north edge.
  const height = e.boss ? Math.min(SPRITE_HEIGHTS[e.type], e.y + 3) : SPRITE_HEIGHTS[e.type];
  const floating = e.type === 'host';
  const bob = Math.sin(time * (floating ? 5 : 4) + e.id) * (floating ? 2 : .7);
  const flip = !['spore', 'host', 'generator'].includes(e.type) && game.player.x < e.x;
  sprite(ctx, e.type, e.x, e.y + bob, height, { flip, flash: e.flash > 0, tilt: e.mode === 'charge' ? (e.aim?.x || 0) * .12 : 0 });
  if (e.type === 'host' && game.enemies.some(other => other.type === 'generator' && other.hp > 0)) {
    const shieldY = e.y - height * .3;
    ctx.strokeStyle = yellow; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.ellipse(e.x, shieldY, height * .47, height * .51, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = .6;
    for (const gen of game.enemies.filter(other => other.type === 'generator' && other.hp > 0)) {
      ctx.beginPath(); ctx.moveTo(e.x, shieldY); ctx.lineTo(gen.x, gen.y - 20); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.setLineDash([]);
  }
  if (!e.boss && e.hp < e.maxHp) {
    ctx.fillStyle = ink; ctx.fillRect(e.x - 15, e.y + 8, 30, 5);
    ctx.fillStyle = e.type === 'generator' ? yellow : magenta; ctx.fillRect(e.x - 14, e.y + 9, 28 * e.hp / e.maxHp, 3);
  }
}

function drawPlayer(ctx, p, time) {
  ctx.save();
  if (p.invulnerable > 0 && Math.floor(time * 12) % 2) ctx.globalAlpha = .55;
  const flip = Math.cos(p.facing) < -.15;
  sprite(ctx, 'hero', p.x, p.y + Math.sin(time * 4) * .5, SPRITE_HEIGHTS.hero, { flip, tilt: p.swing > 0 ? (flip ? -.12 : .12) : 0 });
  ctx.restore();
  // The arc communicates the real attack direction and reach.
  if (p.swing > 0) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.facing);
    ctx.strokeStyle = yellow; ctx.lineWidth = 3; ctx.globalAlpha = Math.min(1, p.swing / .18);
    ctx.beginPath(); ctx.arc(0, 0, 47, -1.35, 1.35); ctx.stroke(); ctx.restore();
  }
  ctx.strokeStyle = yellow; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 9, 3, 0, 0, Math.PI * 2); ctx.stroke();
}

export function renderGame(ctx, game, time, reducedMotion = false) {
  ctx.save();
  // High-density backing store, independent of the 480 × 420 simulation.
  ctx.setTransform(ctx.canvas.width / WIDTH, 0, 0, ctx.canvas.height / HEIGHT, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (game.shake > 0 && !reducedMotion) ctx.translate(Math.sin(time * 90) * 1.5, Math.cos(time * 110) * 1.5);
  const room = art.get(['room', 'room-spore', 'room-host'][game.floor || 0]);
  if (room) ctx.drawImage(room, 0, 0, WIDTH, HEIGHT);
  for (const hazard of game.hazards) {
    const path = new Path2D();
    if (hazard.type === 'pool') path.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
    else path.rect(hazard.x - hazard.w / 2, hazard.y - hazard.h / 2, hazard.w, hazard.h);
    dangerZone(ctx, path, hazard.delay > 0, hazard.type === 'pool' ? '#a4d65e' : magenta);
  }
  if (!reducedMotion) for (const fx of game.effects) if (fx.type === 'trail') {
    ctx.globalAlpha = fx.life / fx.maxLife * .2; sprite(ctx, 'hero', fx.x, fx.y, SPRITE_HEIGHTS.hero); ctx.globalAlpha = 1;
  }
  for (const pickup of game.pickups) {
    const y = pickup.y + (reducedMotion ? 0 : Math.sin(time * 4) * 2);
    ctx.fillStyle = '#a4d65e'; ctx.fillRect(pickup.x - 8, y - 8, 16, 16);
    ctx.drawImage(art.get('heal'), pickup.x - 7, y - 7, 14, 14);
  }
  const actors = [...PILLARS.map(p => ({ ...p, kind: 'pillar' })), ...game.enemies.map(e => ({ ...e, kind: 'enemy' })), { ...game.player, kind: 'player' }].sort((a, b) => a.y - b.y);
  const animationTime = reducedMotion ? 0 : time;
  for (const actor of actors) {
    if (actor.kind === 'pillar') sprite(ctx, 'pillar', actor.x, actor.y, 48);
    else if (actor.kind === 'enemy') drawEnemy(ctx, actor, animationTime, game);
    else drawPlayer(ctx, actor, animationTime);
  }
  for (const shot of game.projectiles) {
    ctx.fillStyle = game.floor === 1 ? '#a4d65e' : magenta;
    ctx.strokeStyle = paper; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  for (const fx of game.effects) {
    if (fx.type === 'number') {
      ctx.globalAlpha = Math.min(1, fx.life * 3); ctx.font = '600 14px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
      const y = fx.y - (1 - fx.life / fx.maxLife) * 22;
      if (fx.value === 'ESCUDO') {
        // Keep shield-hit feedback visual, rather than repeating a combat label.
        ctx.beginPath(); ctx.moveTo(fx.x, y - 14); ctx.lineTo(fx.x + 7, y - 11);
        ctx.lineTo(fx.x + 6, y - 4); ctx.lineTo(fx.x, y); ctx.lineTo(fx.x - 6, y - 4);
        ctx.lineTo(fx.x - 7, y - 11); ctx.closePath();
        ctx.fillStyle = ink; ctx.fill(); ctx.strokeStyle = yellow; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.strokeText(fx.value, fx.x, y);
        ctx.fillStyle = paper; ctx.fillText(fx.value, fx.x, y);
      }
      ctx.globalAlpha = 1;
    } else if (fx.type === 'hit') {
      ctx.strokeStyle = yellow; ctx.lineWidth = 2; ctx.globalAlpha = fx.life / fx.maxLife;
      ctx.beginPath(); ctx.arc(fx.x, fx.y, (1 - fx.life / fx.maxLife) * 21, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

export function renderPreview(ctx, time, reducedMotion = false) {
  const t = reducedMotion ? 0 : time;
  const scene = {
    floor: 0, shake: 0, effects: [], hazards: [], projectiles: [], pickups: [],
    player: { x: 238 + Math.sin(t * .5) * 4, y: 309, r: 9, facing: -1.5, invulnerable: 0, swing: 0 },
    enemies: [
      { id: 1, type: 'butcher', x: 239, y: 200, r: 24, hp: 340, maxHp: 340, boss: true, mode: 'windup', aim: { x: 0, y: 1 } },
      { id: 2, type: 'bat', x: 169 + Math.sin(t) * 3, y: 247, r: 8, hp: 26, maxHp: 26 },
      { id: 3, type: 'grunt', x: 330, y: 260, r: 10, hp: 38, maxHp: 38 },
    ],
  };
  renderGame(ctx, scene, t, reducedMotion);
}
