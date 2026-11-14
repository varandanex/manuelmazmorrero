export const WIDTH = 480;
export const HEIGHT = 420;
export const BOUNDS = { left: 31, right: 449, top: 65, bottom: 381 };
export const PILLARS = [{ x: 105, y: 151, r: 15 }, { x: 375, y: 151, r: 15 }, { x: 105, y: 300, r: 15 }, { x: 375, y: 300, r: 15 }];
export const FLOORS = [
  { name: 'El matadero', boss: 'El Juicer', bossType: 'butcher', mobs: ['grunt', 'bat', 'grunt'], waves: [4, 5], color: '#ba769a', hint: 'Esquiva su embestida. Ataca cuando se quede agotado.', intro: '«Primer piso. Huele a derrota. Ah, no: eres tú.»' },
  { name: 'El jardín podrido', boss: 'La Acaparadora', bossType: 'spore', mobs: ['caster', 'bat', 'grunt'], waves: [5, 6], color: '#9ac982', hint: 'Esquiva sus proyectiles. No pises las zonas verdes.', intro: '«Qué bonito jardín. Todo quiere matarte, pero qué bonito.»' },
  { name: 'La Maraña de Hierro', boss: 'Humanotauro', bossType: 'mantaur', mobs: ['drek', 'jikininki', 'drek'], waves: [6, 7], color: '#75bdc9', hint: 'Sal de las vías señaladas y del círculo de sus puños. Ataca después del golpe.', intro: '«Próxima parada: traumatología. No olvides tus pertenencias ni tus extremidades.»' },
  { name: 'El horno de la furia', boss: 'Elemental de furia', bossType: 'elemental', mobs: ['acid', 'engineer', 'acid'], waves: [5, 7], color: '#ef9b54', hint: 'Sal de los círculos de fuego. Acércate cuando el elemental se quede agotado.', intro: '«Secado rápido y cremación. El servicio de lavandería se nos ha ido de las manos.»' },
  { name: 'El plató final', boss: 'Clon de Krakaren', bossType: 'host', mobs: ['caster', 'bat', 'grunt'], waves: [7, 8], color: '#b89be6', hint: 'Destruye los dos emisores para romper su escudo.', intro: '«La audiencia te adora. Esto no estaba en el contrato.»' },
];
export const UPGRADES = [
  { id: 'power', name: 'Violencia administrativa', description: '+35 % de daño. Reclamaciones, por escrito.', icon: '✦' },
  { id: 'swift', name: 'Pies, para qué os quiero', description: 'Esquiva un 30 % más a menudo y corre un 12 % más.', icon: '»' },
  { id: 'heart', name: 'Terquedad legendaria', description: '+35 de vida máxima. Cuesta más acabar contigo.', icon: '+' },
];

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const unit = (x, y) => { const length = Math.hypot(x, y); return length ? { x: x / length, y: y / length } : { x: 0, y: 1 }; };
const random = (g) => { g.seed = (g.seed * 1664525 + 1013904223) >>> 0; return g.seed / 4294967296; };

export function parseCheckpoint(value) {
  try {
    const data = typeof value === 'string' ? JSON.parse(value) : value;
    if (!data || ![1, 2].includes(data.version) || !Number.isInteger(data.floor) || data.floor < 0 || data.floor >= (data.version === 1 ? 3 : FLOORS.length)) return null;
    if (!Array.isArray(data.perks) || data.perks.length !== data.floor || !data.perks.every(id => UPGRADES.some(u => u.id === id))) return null;
    for (const key of ['score', 'elapsed', 'kills', 'deaths']) if (!Number.isFinite(data[key]) || data[key] < 0 || data[key] > 1e8) return null;
    // Legacy saves retain completed floors and earned perks. An old floor-3
    // checkpoint enters the new third floor, so the expansion is never skipped.
    return { version: 2, floor: data.floor, perks: [...data.perks], score: data.score, elapsed: data.elapsed, kills: data.kills, deaths: data.deaths };
  } catch { return null; }
}

export function createGame(checkpoint = null, seed = Date.now()) {
  const saved = parseCheckpoint(checkpoint);
  const game = {
    seed: seed >>> 0, mode: 'playing', floor: saved?.floor || 0, perks: saved?.perks || [],
    score: saved?.score || 0, elapsed: saved?.elapsed || 0, kills: saved?.kills || 0, deaths: saved?.deaths || 0,
    enemies: [], projectiles: [], hazards: [], effects: [], pickups: [], events: [], id: 0,
    wave: 0, phase: 'intro', phaseTimer: 0, shake: 0, firstHit: false, firstDodge: false,
  };
  startFloor(game);
  return game;
}

export function checkpointOf(game) {
  return { version: 2, floor: game.floor, perks: [...game.perks], score: game.score, elapsed: game.elapsed, kills: game.kills, deaths: game.deaths };
}

export function startFloor(g) {
  const count = id => g.perks.filter(x => x === id).length;
  const maxHp = 100 + 35 * count('heart');
  g.player = { x: 240, y: 336, r: 9, hp: maxHp, maxHp, speed: 116 * (1 + .12 * count('swift')), damage: 24 * (1 + .35 * count('power')), attackCooldown: 0, dashCooldown: 0, dashDuration: 0, dashTime: 1.8 * .7 ** count('swift'), invulnerable: 1.5, facing: -Math.PI / 2, dashX: 0, dashY: -1, swing: 0 };
  g.enemies = []; g.projectiles = []; g.hazards = []; g.effects = []; g.pickups = [];
  g.mode = 'floor-intro'; g.phase = 'intro'; g.phaseTimer = 2.7; g.wave = 0; g.shake = 0;
  g.events.push({ type: 'floor', floor: g.floor }, { type: 'narrator', text: FLOORS[g.floor].intro }, { type: 'floor-intro' });
  g.stageCheckpoint = checkpointOf(g);
}

export function beginFloorCombat(g) {
  if (g.mode !== 'floor-intro' || g.phase !== 'intro') return false;
  g.mode = 'playing';
  g.events.push({ type: 'sound', name: 'floor_start' });
  return true;
}

export function retryFloor(g) {
  const deaths = g.deaths + 1;
  const elapsed = g.elapsed;
  Object.assign(g, g.stageCheckpoint, { perks: [...g.stageCheckpoint.perks], deaths, elapsed });
  g.events.push({ type: 'sound', name: 'retry' });
  startFloor(g);
}

export function chooseUpgrade(g, id) {
  if (g.mode !== 'upgrade' || g.floor >= FLOORS.length - 1 || !UPGRADES.some(u => u.id === id)) return false;
  g.events.push({ type: 'sound', name: 'upgrade_select' });
  g.perks.push(id); g.floor += 1; startFloor(g); return true;
}

export function pauseGame(g) { if (g.mode === 'playing') { g.mode = 'paused'; return true; } return false; }
export function resumeGame(g) { if (g.mode === 'paused') g.mode = 'playing'; }

function spawnEnemy(g, type, x, y, extra = {}) {
  const stats = {
    grunt: { r: 10, hp: 38 + g.floor * 5, speed: 34 + g.floor * 4, damage: 9 },
    bat: { r: 8, hp: 26, speed: 55, damage: 7 },
    caster: { r: 11, hp: 42, speed: 25, damage: 8 },
    drek: { r: 9, hp: 35, speed: 59, damage: 8 },
    jikininki: { r: 12, hp: 78, speed: 24, damage: 10 },
    acid: { r: 12, hp: 60, speed: 29, damage: 9 },
    engineer: { r: 16, hp: 100, speed: 20, damage: 12 },
    butcher: { r: 24, hp: 340, speed: 26, damage: 18 },
    spore: { r: 24, hp: 380, speed: 0, damage: 13 },
    mantaur: { r: 27, hp: 450, speed: 29, damage: 18 },
    elemental: { r: 26, hp: 520, speed: 22, damage: 16 },
    host: { r: 23, hp: 630, speed: 0, damage: 15 },
    generator: { r: 15, hp: 96, speed: 0, damage: 0 },
  }[type];
  const enemy = { id: ++g.id, type, x, y, ...stats, maxHp: stats.hp, mode: 'idle', timer: 1.2 + random(g) * .6, flash: 0, boss: FLOORS.some(f => f.bossType === type), ...extra };
  g.enemies.push(enemy); return enemy;
}

function spawnWave(g) {
  g.wave += 1; g.phase = 'mobs';
  const positions = [{ x: 65, y: 90 }, { x: 240, y: 86 }, { x: 415, y: 90 }, { x: 65, y: 235 }, { x: 415, y: 235 }, { x: 180, y: 90 }, { x: 300, y: 90 }, { x: 240, y: 195 }];
  const floor = FLOORS[g.floor], count = floor.waves[g.wave - 1];
  for (let i = 0; i < count; i++) {
    const type = floor.mobs[i % floor.mobs.length];
    spawnEnemy(g, type, positions[i].x, positions[i].y);
  }
  g.events.push({ type: 'announcement', text: `OLEADA ${g.wave} / 2 · ${count} malas decisiones` });
}

function spawnGenerators(g) {
  spawnEnemy(g, 'generator', 155, 193); spawnEnemy(g, 'generator', 325, 193);
}

function spawnBoss(g) {
  g.phase = 'boss';
  const type = FLOORS[g.floor].bossType;
  spawnEnemy(g, type, 240, type === 'mantaur' || type === 'elemental' ? 155 : 125);
  if (type === 'host') spawnGenerators(g);
  // The boss-intro sting belongs to the reveal screen, not a second playback here.
  g.events.push({ type: 'announcement', text: FLOORS[g.floor].hint }, { type: 'narrator', text: `«${FLOORS[g.floor].hint} De nada, por cierto.»` });
}

// Conversation -> boss reveal -> battle are separate, explicitly acknowledged
// states. No simulation clock runs while the player reads either presentation.
export function beginBossReveal(g) {
  if (g.mode !== 'boss-intro' || g.phase !== 'warning') return false;
  g.mode = 'boss-reveal'; g.events.push({ type: 'boss-reveal' }); return true;
}

export function beginBossFight(g) {
  if (g.mode !== 'boss-reveal' || g.phase !== 'warning') return false;
  g.mode = 'playing'; spawnBoss(g); return true;
}

function moveEntity(entity, dx, dy, pillars = true) {
  entity.x = clamp(entity.x + dx, BOUNDS.left + entity.r, BOUNDS.right - entity.r);
  entity.y = clamp(entity.y + dy, BOUNDS.top + entity.r, BOUNDS.bottom - entity.r);
  if (pillars) for (const p of PILLARS) {
    const d = distance(entity, p);
    if (d < entity.r + p.r) {
      const direction = unit(entity.x - p.x, entity.y - p.y);
      entity.x = p.x + direction.x * (entity.r + p.r);
      entity.y = p.y + direction.y * (entity.r + p.r);
    }
  }
}

function effect(g, type, x, y, value = '', color = '#e8bb70') {
  g.effects.push({ type, x, y, value, color, life: type === 'number' ? .8 : .35, maxLife: type === 'number' ? .8 : .35 });
}

export function damagePlayer(g, amount) {
  const p = g.player;
  if (g.mode !== 'playing' || p.invulnerable > 0 || p.dashDuration > 0) return false;
  p.hp = Math.max(0, p.hp - amount); p.invulnerable = 1.05; g.shake = .2;
  effect(g, 'number', p.x, p.y - 17, `−${amount}`, '#ec7a74');
  g.events.push({ type: 'sound', name: p.hp === 0 ? 'player_death' : 'player_hurt' });
  if (!g.firstHit) { g.firstHit = true; g.events.push({ type: 'narrator', text: '«Eso ha dolido hasta a los espectadores. Repite.»' }); }
  if (p.hp === 0) { g.mode = 'dead'; g.events.push({ type: 'dead' }); }
  return true;
}

function damageEnemy(g, e, amount) {
  if (e.hp <= 0) return;
  if (e.type === 'host' && g.enemies.some(other => other.type === 'generator' && other.hp > 0)) {
    g.events.push({ type: 'sound', name: 'shield_block' });
    effect(g, 'number', e.x, e.y - 22, 'ESCUDO', '#b8a1ed'); return;
  }
  const multiplier = e.mode === 'recover' ? 1.6 : 1;
  const damage = Math.round(amount * multiplier);
  e.hp = Math.max(0, e.hp - damage); e.flash = .12;
  effect(g, 'number', e.x, e.y - e.r, String(damage), multiplier > 1 ? '#f8da96' : '#eee7da');
  effect(g, 'hit', e.x, e.y);
  if (!e.boss && e.type !== 'generator') {
    const direction = unit(e.x - g.player.x, e.y - g.player.y);
    moveEntity(e, direction.x * 10, direction.y * 10);
  }
  if (e.hp === 0) {
    g.kills += 1; g.score += e.boss ? 1000 : e.type === 'generator' ? 150 : 50;
    if (!e.boss) g.events.push({ type: 'sound', name: e.type === 'generator' ? 'generator_destroy' : 'enemy_death' });
    if (e.type === 'generator' && !g.enemies.some(other => other.type === 'generator' && other.hp > 0)) g.events.push({ type: 'sound', name: 'shield_break' });
    if (!e.boss && e.type !== 'generator' && random(g) < .4) g.pickups.push({ x: e.x, y: e.y, life: 18 });
    if (e.type === 'generator') g.events.push({ type: 'announcement', text: 'EMISOR DESTRUIDO · El contrato empieza a fallar' });
  } else g.events.push({ type: 'sound', name: e.boss && multiplier > 1 ? 'hit_heavy' : 'hit_enemy' });
}

function attack(g) {
  const p = g.player;
  if (p.attackCooldown > 0 || p.dashDuration > 0) return;
  const candidates = g.enemies.filter(e => e.hp > 0 && distance(e, p) < 70 + e.r).sort((a, b) => distance(a, p) - distance(b, p));
  if (candidates.length) p.facing = Math.atan2(candidates[0].y - p.y, candidates[0].x - p.x);
  p.attackCooldown = .42; p.swing = .18;
  g.events.push({ type: 'sound', name: 'attack_swing' });
  for (const e of g.enemies) {
    if (distance(e, p) > 47 + e.r) continue;
    const angle = Math.atan2(e.y - p.y, e.x - p.x);
    const delta = Math.abs(Math.atan2(Math.sin(angle - p.facing), Math.cos(angle - p.facing)));
    if (delta < 1.35 || distance(e, p) < 19) damageEnemy(g, e, p.damage);
  }
}

function dash(g, mx, my) {
  const p = g.player;
  if (p.dashCooldown > 0 || p.dashDuration > 0) return;
  const direction = mx || my ? unit(mx, my) : { x: Math.cos(p.facing), y: Math.sin(p.facing) };
  p.dashX = direction.x; p.dashY = direction.y; p.dashDuration = .24; p.dashCooldown = p.dashTime; p.invulnerable = Math.max(p.invulnerable, .32);
  g.events.push({ type: 'sound', name: 'dash' });
  if (!g.firstDodge) { g.firstDodge = true; g.events.push({ type: 'narrator', text: '«Logro: evasión de responsabilidades. Se nota la práctica.»' }); }
}

function shoot(g, e, angle, speed = 91, damage = 9) {
  g.projectiles.push({ x: e.x + Math.cos(angle) * (e.r + 5), y: e.y + Math.sin(angle) * (e.r + 5), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 4, damage, life: 6, color: ['spore', 'acid'].includes(e.type) ? '#a4d17b' : e.type === 'elemental' ? '#ff963f' : '#ed147b' });
}

function tickBoss(g, e, dt) {
  const p = g.player;
  e.timer -= dt;
  if (e.type === 'butcher') {
    if (e.mode === 'idle') {
      const d = unit(p.x - e.x, p.y - e.y); moveEntity(e, d.x * e.speed * dt, d.y * e.speed * dt);
      if (e.timer <= 0) { e.mode = 'windup'; e.timer = 1.1; e.aim = unit(p.x - e.x, p.y - e.y); g.events.push({ type: 'sound', name: 'butcher_windup' }); }
    } else if (e.mode === 'windup' && e.timer <= 0) { e.mode = 'charge'; e.timer = .85; g.events.push({ type: 'sound', name: 'butcher_charge' }); }
    else if (e.mode === 'charge') {
      const before = { x: e.x, y: e.y }; moveEntity(e, e.aim.x * 255 * dt, e.aim.y * 255 * dt);
      if (e.timer <= 0 || distance(before, e) < 255 * dt * .35) { e.mode = 'recover'; e.timer = 2.2; g.shake = .18; g.events.push({ type: 'sound', name: 'boss_recover' }); }
    } else if (e.mode === 'recover' && e.timer <= 0) { e.mode = 'idle'; e.timer = .65; }
  }
  if (e.type === 'spore') {
    if (e.mode === 'idle' && e.timer <= 0) { e.mode = 'windup'; e.timer = 1; }
    else if (e.mode === 'windup' && e.timer <= 0) {
      const aim = Math.atan2(p.y - e.y, p.x - e.x);
      for (let i = -2; i <= 2; i++) shoot(g, e, aim + i * .38, 85, 11);
      g.events.push({ type: 'sound', name: 'projectile_cast' }, { type: 'sound', name: 'poison_warning' });
      const spots = [{ x: p.x, y: p.y }, { x: 150 + random(g) * 180, y: 210 + random(g) * 105 }];
      for (const [index, s] of spots.entries()) g.hazards.push({ type: 'pool', ...s, r: 29, delay: 1.25, life: 4.3, damage: 11, audioLead: index === 0 });
      e.mode = 'recover'; e.timer = 1.7;
    } else if (e.mode === 'recover' && e.timer <= 0) { e.mode = 'idle'; e.timer = .8; }
  }
  if (e.type === 'mantaur' || e.type === 'elemental') {
    if (e.mode === 'idle') {
      const direction = unit(p.x - e.x, p.y - e.y);
      moveEntity(e, direction.x * e.speed * dt, direction.y * e.speed * dt);
      if (e.timer <= 0) {
        e.mode = 'windup'; e.timer = e.type === 'mantaur' ? 1.1 : 1.3;
        if (e.type === 'mantaur') {
          // Environmental live rail and a local smash, both locked at warning time.
          g.hazards.push({ type: 'rail', x: p.x, y: 223, w: 30, h: 316, delay: 1.1, life: 1.8, damage: 16, audioLead: true });
          g.hazards.push({ type: 'strike', x: e.x, y: e.y, r: 54, delay: 1.1, life: 1.45, damage: 20 });
          g.events.push({ type: 'sound', name: 'beam_warning' });
        } else {
          const side = (e.castCount || 0) % 2;
          const spots = [{ x: p.x, y: p.y }, { x: 125, y: side ? 325 : 220 }, { x: 355, y: side ? 220 : 325 }];
          for (const [index, spot] of spots.entries()) g.hazards.push({ type: 'fire', ...spot, r: 32, delay: 1.3, life: 3.1, damage: 14, audioLead: index === 0 });
          e.castCount = (e.castCount || 0) + 1;
          g.events.push({ type: 'sound', name: 'poison_warning' });
        }
      }
    } else if (e.mode === 'windup' && e.timer <= 0) {
      if (e.type === 'elemental') {
        const aim = Math.atan2(p.y - e.y, p.x - e.x);
        for (let i = -1; i <= 1; i++) shoot(g, e, aim + i * .45, 84, 10);
        g.events.push({ type: 'sound', name: 'projectile_cast' });
      }
      e.mode = 'recover'; e.timer = 2.2;
      g.events.push({ type: 'sound', name: 'boss_recover' });
    } else if (e.mode === 'recover' && e.timer <= 0) { e.mode = 'idle'; e.timer = 1; }
  }
  if (e.type === 'host') {
    e.x = 240 + Math.sin(g.elapsed * .8) * 76;
    e.y = 111 + Math.sin(g.elapsed * 1.2) * 15;
    if (e.hp <= e.maxHp * .5 && !e.secondPhase) {
      e.secondPhase = true; spawnGenerators(g);
      g.events.push({ type: 'sound', name: 'host_phase_two' });
      g.events.push({ type: 'announcement', text: 'CAMBIO DE REGLAS · El escudo vuelve a estar activo' }, { type: 'narrator', text: '«No son trampas. Es una actualización de las condiciones de uso.»' });
    }
    if (e.timer <= 0) {
      const aim = Math.atan2(p.y - e.y, p.x - e.x);
      for (let i = -1; i <= 1; i++) shoot(g, e, aim + i * .3, 102, 12);
      g.events.push({ type: 'sound', name: 'projectile_cast' }, { type: 'sound', name: 'beam_warning' });
      g.hazards.push({ type: 'beam', x: p.x, y: 225, w: 32, h: 320, delay: 1.15, life: 1.85, damage: 16, audioLead: true });
      if (e.secondPhase) g.hazards.push({ type: 'beam', x: 240, y: p.y, w: 418, h: 26, delay: 1.15, life: 1.85, damage: 16 });
      e.timer = e.secondPhase ? 2.3 : 2.8;
    }
  }
}

function tickEnemy(g, e, dt) {
  if (e.hp <= 0) return;
  e.flash = Math.max(0, e.flash - dt);
  if (e.boss) tickBoss(g, e, dt);
  else if (e.type !== 'generator') {
    e.timer -= dt;
    const toward = unit(g.player.x - e.x, g.player.y - e.y);
    const gap = distance(e, g.player);
    if (e.type === 'caster' || e.type === 'acid') {
      const multiplier = gap < 100 ? -.6 : gap > 155 ? 1 : 0;
      moveEntity(e, toward.x * e.speed * dt * multiplier, toward.y * e.speed * dt * multiplier);
      if (e.timer <= 0) { shoot(g, e, Math.atan2(toward.y, toward.x), e.type === 'acid' ? 95 : 78, e.type === 'acid' ? 10 : 8); e.timer = e.type === 'acid' ? 2.5 : 2.2; g.events.push({ type: 'sound', name: 'projectile_cast' }); }
    } else if (e.type === 'jikininki') {
      if (e.mode === 'idle') {
        moveEntity(e, toward.x * e.speed * dt, toward.y * e.speed * dt);
        if (gap < 75 && e.timer <= 0) {
          e.mode = 'windup'; e.timer = .75;
          g.hazards.push({ type: 'strike', x: e.x, y: e.y, r: 40, delay: .75, life: 1, damage: 13, audioLead: true });
          g.events.push({ type: 'sound', name: 'butcher_windup' });
        }
      } else if (e.mode === 'windup' && e.timer <= 0) { e.mode = 'recover'; e.timer = 1.1; }
      else if (e.mode === 'recover' && e.timer <= 0) { e.mode = 'idle'; e.timer = 1.3; }
    } else if (e.type === 'engineer') {
      if (e.mode === 'idle') {
        moveEntity(e, toward.x * e.speed * dt, toward.y * e.speed * dt);
        if (e.timer <= 0) { e.mode = 'windup'; e.timer = 1; e.aim = toward; g.events.push({ type: 'sound', name: 'butcher_windup' }); }
      } else if (e.mode === 'windup' && e.timer <= 0) { e.mode = 'charge'; e.timer = 1; g.events.push({ type: 'sound', name: 'butcher_charge' }); }
      else if (e.mode === 'charge') {
        const before = { x: e.x, y: e.y }; moveEntity(e, e.aim.x * 155 * dt, e.aim.y * 155 * dt);
        if (e.timer <= 0 || distance(before, e) < 155 * dt * .35) { e.mode = 'recover'; e.timer = 1.6; }
      } else if (e.mode === 'recover' && e.timer <= 0) { e.mode = 'idle'; e.timer = 1.7; }
    } else {
      const wobble = ['bat', 'drek'].includes(e.type) ? Math.sin(g.elapsed * 5 + e.id) * .5 : 0;
      moveEntity(e, (toward.x - toward.y * wobble) * e.speed * dt, (toward.y + toward.x * wobble) * e.speed * dt);
    }
    for (const other of g.enemies) {
      if (other === e || other.hp <= 0 || other.boss || other.type === 'generator') continue;
      const gap = distance(e, other);
      if (gap < e.r + other.r && gap > 0) {
        const push = unit(e.x - other.x, e.y - other.y);
        moveEntity(e, push.x * 18 * dt, push.y * 18 * dt);
      }
    }
  }
  if (e.damage && e.mode !== 'recover' && distance(e, g.player) < e.r + g.player.r - 2) damagePlayer(g, e.damage);
}

export function updateGame(g, delta, input = {}) {
  if (g.mode !== 'playing') return;
  const dt = clamp(delta, 0, .05);
  if (!dt) return;
  g.elapsed += dt; g.shake = Math.max(0, g.shake - dt);
  const p = g.player;
  for (const key of ['invulnerable', 'attackCooldown', 'dashCooldown', 'swing']) p[key] = Math.max(0, p[key] - dt);
  let mx = Number.isFinite(input.x) ? input.x : 0, my = Number.isFinite(input.y) ? input.y : 0;
  const length = Math.hypot(mx, my);
  if (length > 1) { mx /= length; my /= length; }
  if (input.dash) dash(g, mx, my);
  if (p.dashDuration > 0) {
    p.dashDuration = Math.max(0, p.dashDuration - dt);
    moveEntity(p, p.dashX * 330 * dt, p.dashY * 330 * dt);
    effect(g, 'trail', p.x, p.y, '', '#9ac9b1');
  } else {
    moveEntity(p, mx * p.speed * dt, my * p.speed * dt);
    if (mx || my) p.facing = Math.atan2(my, mx);
  }
  if (input.attack) attack(g);
  for (const e of g.enemies) tickEnemy(g, e, dt);
  for (const shot of g.projectiles) {
    shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
    if (shot.x < BOUNDS.left || shot.x > BOUNDS.right || shot.y < BOUNDS.top || shot.y > BOUNDS.bottom || PILLARS.some(pillar => distance(shot, pillar) < pillar.r)) shot.life = 0;
    if (shot.life > 0 && distance(shot, p) < shot.r + p.r) {
      if (p.dashDuration <= 0) { damagePlayer(g, shot.damage); shot.life = 0; }
    }
  }
  for (const hazard of g.hazards) {
    const wasWarning = hazard.delay > 0;
    hazard.life -= dt; hazard.delay -= dt;
    if (hazard.life <= 0 || hazard.delay > 0) continue;
    if (wasWarning && hazard.audioLead) g.events.push({ type: 'sound', name: hazard.type === 'pool' ? 'poison_activate' : hazard.type === 'strike' ? 'hit_heavy' : 'beam_fire' });
    const collides = Number.isFinite(hazard.r) ? distance(hazard, p) < hazard.r + p.r * .5 : Math.abs(p.x - hazard.x) < hazard.w / 2 + p.r * .5 && Math.abs(p.y - hazard.y) < hazard.h / 2 + p.r * .5;
    if (collides) damagePlayer(g, hazard.damage);
  }
  for (const pickup of g.pickups) {
    pickup.life -= dt;
    if (distance(pickup, p) < 22) {
      const healed = Math.min(10, p.maxHp - p.hp); p.hp += healed; pickup.life = 0;
      if (healed) effect(g, 'number', p.x, p.y - 15, `+${healed}`, '#9ac9b1');
      g.events.push({ type: 'sound', name: 'heal' });
    }
  }
  for (const fx of g.effects) fx.life -= dt;
  g.effects = g.effects.filter(fx => fx.life > 0);
  g.projectiles = g.projectiles.filter(shot => shot.life > 0);
  g.hazards = g.hazards.filter(h => h.life > 0);
  g.pickups = g.pickups.filter(h => h.life > 0);
  const deadBoss = g.enemies.some(e => e.boss && e.hp <= 0);
  g.enemies = g.enemies.filter(e => e.hp > 0);
  if (g.mode !== 'playing') return;
  if (deadBoss) {
    g.enemies = []; g.projectiles = []; g.hazards = [];
    g.mode = g.floor === FLOORS.length - 1 ? 'won' : 'upgrade';
    g.events.push({ type: g.mode }, { type: 'sound', name: g.mode === 'won' ? 'victory' : 'boss_defeat' }); return;
  }
  if (['intro', 'between', 'warning'].includes(g.phase)) {
    g.phaseTimer -= dt;
    if (g.phaseTimer <= 0) {
      if (g.phase === 'warning') { g.mode = 'boss-intro'; g.events.push({ type: 'boss-intro' }); }
      else spawnWave(g);
    }
  } else if (g.phase === 'mobs' && g.enemies.length === 0) {
    if (g.wave < 2) { g.phase = 'between'; g.phaseTimer = 1.4; }
    else {
      g.phase = 'warning'; g.phaseTimer = 2.6;
      const healed = Math.min(25, p.maxHp - p.hp); p.hp += healed;
      if (healed) effect(g, 'number', p.x, p.y - 20, `+${healed}`, '#9ac9b1');
      g.events.push({ type: 'announcement', text: `JEFE DE PISO · ${FLOORS[g.floor].boss}` });
    }
  }
}

export function formatTime(seconds) {
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
