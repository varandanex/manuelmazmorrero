import { createGame, updateGame, chooseUpgrade, retryFloor, pauseGame, resumeGame, parseCheckpoint, formatTime, FLOORS, UPGRADES } from './game.js';
import { loadArt, renderGame, renderPreview } from './render.js';
import { createAudio } from './audio.js';

const $ = id => document.getElementById(id);
const canvas = $('arena');
const ctx = canvas.getContext('2d');
const previewCtx = $('preview').getContext('2d');
const storageKey = 'manu-dungeon-checkpoint-v1';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const keys = new Set();
const touch = { x: 0, y: 0, attack: false, dash: false };
let game = null, saved = null, lastFrame = 0, accumulator = 0, hudAt = 0;
let modalKind = '', helpWasPlaying = false, announcementUntil = 0, floorToastUntil = 0;
let joystickPointer = null, attackPointer = null, dashPointer = null;
let artReady = false;
const audio = createAudio({ onChange: updateSoundLabel });
try { audio.setVolumes(JSON.parse(localStorage.getItem('manolo-audio-volumes-v1')) || {}); } catch { /* Audio remains usable without storage. */ }

function readSave() {
  try { saved = parseCheckpoint(localStorage.getItem(storageKey)); } catch { saved = null; }
  $('continue').hidden = !saved;
  $('start').className = saved ? 'text-button' : 'primary-button';
  $('start').textContent = saved ? 'Empezar una partida nueva' : 'Entrar en la mazmorra';
}

function saveCheckpoint() {
  try { localStorage.setItem(storageKey, JSON.stringify(game.stageCheckpoint)); } catch { /* The game remains playable with storage disabled. */ }
}

function clearSave() {
  saved = null;
  try { localStorage.removeItem(storageKey); } catch { /* Private mode can reject storage. */ }
}

function unlockAudio() { void audio.unlock(); }

function updateSoundLabel() {
  const state = audio.status();
  $('sound').setAttribute('aria-label', state.enabled ? 'Desactivar sonido' : 'Activar sonido');
  $('sound').setAttribute('aria-pressed', String(state.enabled));
  $('sound').title = state.enabled ? 'Desactivar sonido · Volumen en las reglas o la pausa' : 'Activar sonido';
  $('sound-label').textContent = state.enabled ? 'ON' : 'OFF';
  const toggle = $('audio-toggle');
  if (toggle) { toggle.textContent = state.enabled ? 'Desactivar sonido' : 'Activar sonido'; toggle.setAttribute('aria-pressed', String(state.enabled)); }
  if ($('audio-status')) $('audio-status').textContent = state.error ? 'El navegador no permite activar el audio. Puedes seguir jugando sin sonido.'
    : !state.enabled ? 'El sonido está desactivado. Actívalo cuando quieras.'
    : state.musicError ? 'La música no se ha podido reproducir. Desactiva y vuelve a activar el sonido.'
    : !state.ready ? 'Preparando los efectos… Puedes seguir jugando.'
    : state.missing.length ? 'Algunos efectos no han cargado. Puedes seguir jugando.'
    : 'Sonido activado. La música se detiene al pausar.';
}

function toggleSound() {
  void audio.setEnabled(!audio.status().enabled);
  audio.play('ui_confirm');
}

function addAudioControls() {
  const section = document.createElement('section'); section.className = 'audio-controls'; section.setAttribute('aria-label', 'Ajustes de sonido');
  const heading = document.createElement('h3'); heading.textContent = 'Mezcla de sonido';
  section.append(heading);
  for (const [channel, text] of [['effects', 'Efectos'], ['music', 'Música']]) {
    const row = document.createElement('div'), label = document.createElement('label'), input = document.createElement('input'), output = document.createElement('output');
    row.className = 'audio-volume'; input.type = 'range'; input.min = '0'; input.max = '100'; input.step = '1'; input.id = `volume-${channel}`;
    label.htmlFor = input.id; label.textContent = text; input.value = Math.round(audio.status().volumes[channel] * 100);
    output.htmlFor = input.id; output.textContent = `${input.value} %`;
    input.addEventListener('input', () => {
      audio.setVolumes({ [channel]: Number(input.value) / 100 }); output.textContent = `${input.value} %`;
      try { localStorage.setItem('manolo-audio-volumes-v1', JSON.stringify(audio.status().volumes)); } catch { /* Optional preference storage. */ }
    });
    input.addEventListener('change', () => { unlockAudio(); if (channel === 'effects') audio.play('ui_confirm'); });
    row.append(label, output, input); section.append(row);
  }
  const toggle = document.createElement('button'); toggle.id = 'audio-toggle'; toggle.type = 'button'; toggle.className = 'text-button'; toggle.addEventListener('click', toggleSound);
  const status = document.createElement('p'); status.id = 'audio-status'; status.className = 'quiet-note'; status.setAttribute('role', 'status');
  section.append(toggle, status); $('modal-content').append(section); updateSoundLabel();
}

function clearInput() {
  keys.clear(); touch.x = 0; touch.y = 0; touch.attack = false; touch.dash = false;
  joystickPointer = null; attackPointer = null; dashPointer = null;
  $('joystick-knob').style.transform = ''; $('attack').classList.remove('pressed'); $('dash').classList.remove('pressed');
}

function setModal(kind, eyebrow, title, copy) {
  clearInput(); modalKind = kind;
  $('modal-eyebrow').textContent = eyebrow; $('modal-title').textContent = title; $('modal-copy').textContent = copy;
  $('modal-content').replaceChildren(); $('modal-actions').replaceChildren();
  if (!$('modal').open) $('modal').showModal();
}

function modalButton(label, action, secondary = false, confirm = true) {
  const button = document.createElement('button'); button.type = 'button'; button.className = secondary ? 'text-button' : 'primary-button'; button.textContent = label;
  button.addEventListener('click', () => { unlockAudio(); action(); if (confirm) audio.play('ui_confirm'); }); $('modal-actions').append(button); return button;
}

function closeModal() { $('modal').close(); modalKind = ''; clearInput(); }

function start(checkpoint = null) {
  if (!artReady) return;
  closeModal(); unlockAudio(); game = createGame(checkpoint);
  $('lobby').hidden = true; $('game-screen').hidden = false; document.body.classList.add('game-mode');
  window.scrollTo(0, 0); lastFrame = performance.now(); accumulator = 0; hudAt = 0;
  saveCheckpoint(); consumeEvents(); updateHud(); renderGame(ctx, game, game.elapsed, reducedMotion.matches);
}

function backToMenu() {
  closeModal(); game = null; audio.setScene('lobby'); audio.setPaused(false); document.body.classList.remove('game-mode');
  $('game-screen').hidden = true; $('lobby').hidden = false; readSave(); window.scrollTo(0, 0);
  (saved ? $('continue') : $('start')).focus({ preventScroll: true });
}

function showPause() {
  if (!game || !pauseGame(game)) return;
  audio.setPaused(true);
  setModal('pause', 'PAUSA PUBLICITARIA', 'Hasta el caos descansa.', 'La audiencia puede esperar. Tu partida está en pausa.');
  modalButton('Volver al espectáculo', () => { closeModal(); resumeGame(game); audio.setPaused(false); canvas.focus({ preventScroll: true }); });
  modalButton('Volver al menú', backToMenu, true);
  const note = document.createElement('p'); note.className = 'quiet-note'; note.textContent = 'Al salir se conserva el inicio del piso actual, no la sala exacta.'; $('modal-content').append(note);
  addAudioControls();
}

function showHelp() {
  helpWasPlaying = game?.mode === 'playing';
  if (helpWasPlaying) { pauseGame(game); audio.setPaused(true); }
  setModal('help', 'MANUAL DE SUPERVIVENCIA', 'No mueras. Sobre todo eso.', 'Elimina dos oleadas y derrota al jefe de cada piso. Después, elige una mejora.');
  const rows = document.createElement('div'); rows.className = 'help-rows';
  const rules = [
    ['Muévete', 'Móvil: arrastra el joystick izquierdo. Ordenador: WASD o flechas.'],
    ['Ataca de cerca', 'Mantén pulsado ATACAR o espacio / J. Manolo apunta al enemigo cercano.'],
    ['Esquiva el peligro', 'Pulsa ESQUIVAR o Mayús / K. Durante el impulso no recibes daño. Espera a que se recargue.'],
    ['Lee al enemigo', 'Las marcas en el suelo avisan antes de atacar. Aprovecha cuando un jefe esté VULNERABLE.'],
    ['No estás condenado', 'Los botiquines verdes recuperan vida. Si caes, puedes repetir el piso conservando tus mejoras.'],
  ];
  for (const [title, copy] of rules) {
    const row = document.createElement('div'); row.className = 'help-row'; const strong = document.createElement('strong'); strong.textContent = title;
    row.append(strong, document.createTextNode(copy)); rows.append(row);
  }
  $('modal-content').append(rows); addAudioControls();
  modalButton('Entendido. Más o menos.', closeHelp);
}

function closeHelp() {
  closeModal(); if (helpWasPlaying && game) { resumeGame(game); audio.setPaused(false); } helpWasPlaying = false;
}

function showUpgrade() {
  setModal('upgrade', `PISO 0${game.floor + 1} COMPLETADO`, 'Sigues vivo. Qué incómodo.', `La audiencia exige una segunda temporada.
Elige una ventaja. Recuperarás toda la vida.`);
  const list = document.createElement('div'); list.className = 'upgrade-list';
  for (const upgrade of UPGRADES) {
    const button = document.createElement('button'); button.className = 'upgrade-option';
    const icon = document.createElement('img'); icon.className = 'icon'; icon.alt = ''; icon.src = `/assets/icons/${({ power: 'wrench', swift: 'lightning', heart: 'heart' })[upgrade.id]}.svg`;
    const text = document.createElement('div'), title = document.createElement('strong'), description = document.createElement('small');
    title.textContent = upgrade.name; description.textContent = upgrade.description; text.append(title, description); button.append(icon, text);
    button.addEventListener('click', () => {
      unlockAudio();
      if (chooseUpgrade(game, upgrade.id)) { closeModal(); saveCheckpoint(); consumeEvents(); updateHud(); }
    }); list.append(button);
  }
  $('modal-content').append(list);
  list.querySelector('button').focus();
}

function showDeath() {
  setModal('dead', 'SEÑAL INTERRUMPIDA', 'Técnicamente, has muerto.', `«Pero has firmado tres temporadas. Levántate.»
Repite este piso con toda la vida y tus mejoras.`);
  const portrait = document.createElement('img'); portrait.className = 'result-portrait'; portrait.src = '/assets/webp/Manu-02-caos-absoluto.webp'; portrait.alt = 'Manu, sorprendido por el resultado'; $('modal-content').append(portrait);
  addResults();
  modalButton('Otra oportunidad', () => { closeModal(); retryFloor(game); saveCheckpoint(); consumeEvents(); updateHud(); }, false, false);
  modalButton('Salir al menú', backToMenu, true);
}

function addResults() {
  const grid = document.createElement('div'); grid.className = 'result-grid';
  for (const [number, label] of [[formatTime(game.elapsed), 'TIEMPO EN ANTENA'], [game.score, 'PUNTOS DE AUDIENCIA']]) {
    const item = document.createElement('div'), value = document.createElement('b'), caption = document.createElement('span');
    value.textContent = number; caption.textContent = label; item.append(value, caption); grid.append(item);
  }
  $('modal-content').append(grid);
}

function showVictory() {
  clearSave();
  setModal('won', 'LOGRO DESBLOQUEADO · LEYENDA DE LA MAZMORRA', 'Feliz cumpleaños, mazmorrero.', `Tres pisos. Tres jefes. Cero respeto por el reglamento.
«Has sobrevivido, Manolo. Ahora intenta sobrevivir a otro año.»`);
  addResults();
  const note = document.createElement('p'); note.className = 'quiet-note'; note.textContent = `Criaturas derrotadas: ${game.kills} · Reintentos: ${game.deaths}. La organización niega toda responsabilidad.`; $('modal-content').append(note);
  modalButton('Otra ronda de malas decisiones', () => start(), false, false);
  modalButton('Volver al menú', backToMenu, true);
}

function consumeEvents() {
  if (!game) return;
  const events = game.events.splice(0);
  audio.handleEvents(events, game);
  for (const event of events) {
    if (event.type === 'narrator') { $('narrator').textContent = event.text; $('mobile-narrator').textContent = event.text; }
    if (event.type === 'announcement') { $('announcement').textContent = event.text; announcementUntil = game.elapsed + 4.5; }
    if (event.type === 'floor') {
      floorToastUntil = game.elapsed + 2.6; announcementUntil = 0;
      $('room-number').textContent = `PISO 0${game.floor + 1}`; $('room-name').textContent = FLOORS[game.floor].name;
      $('floor-label').textContent = `PISO 0${game.floor + 1} / 03`;
      for (const item of document.querySelectorAll('[data-floor]')) {
        item.classList.toggle('active', Number(item.dataset.floor) === game.floor); item.classList.toggle('complete', Number(item.dataset.floor) < game.floor);
      }
      $('perks').textContent = game.perks.length ? game.perks.map(id => UPGRADES.find(u => u.id === id).name).join(' · ') : 'Tu optimismo. De momento.';
    }
    if (event.type === 'upgrade') showUpgrade();
    if (event.type === 'dead') showDeath();
    if (event.type === 'won') showVictory();
  }
}

function updateHud() {
  if (!game) return;
  const p = game.player;
  $('health-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  $('health-fill').style.width = `${p.hp / p.maxHp * 100}%`;
  $('health-fill').style.background = p.hp < p.maxHp * .3 ? 'var(--danger)' : 'var(--mint)';
  $('timer').textContent = formatTime(game.elapsed); $('run-score').textContent = String(game.score).padStart(4, '0');
  $('dash').classList.toggle('cooldown', p.dashCooldown > 0);
  $('dash-label').textContent = p.dashCooldown > 0 ? `${p.dashCooldown.toFixed(1)} s` : 'ESQUIVAR';
  const boss = game.enemies.find(e => e.boss);
  $('boss-hud').hidden = !boss;
  if (boss) {
    $('boss-name').textContent = FLOORS[game.floor].boss;
    $('boss-fill').style.width = `${boss.hp / boss.maxHp * 100}%`;
    $('boss-state').textContent = boss.type === 'host' && game.enemies.some(e => e.type === 'generator') ? 'ESCUDO' : boss.mode === 'recover' ? 'VULNERABLE' : boss.mode === 'windup' ? '¡CUIDADO!' : '';
  }
  $('objective').textContent = game.phase === 'boss' ? FLOORS[game.floor].hint : game.phase === 'warning' ? 'Prepárate. Llega el jefe de piso.' : game.phase === 'intro' ? 'El espectáculo está a punto de empezar.' : game.phase === 'between' ? 'Un respiro. No te acostumbres.' : `OLEADA ${game.wave}/2 · ${game.enemies.length} enemigos restantes`;
  $('floor-toast').classList.toggle('visible', game.elapsed < floorToastUntil);
  $('announcement').classList.toggle('visible', game.elapsed < announcementUntil && game.elapsed > floorToastUntil);
}

function frame(now) {
  const delta = lastFrame ? Math.min(.1, Math.max(0, (now - lastFrame) / 1000)) : 0;
  lastFrame = now;
  if (game) {
    if (game.mode === 'playing' && !document.hidden) {
      accumulator += delta;
      while (accumulator >= 1 / 60) {
        const x = touch.x + (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
        const y = touch.y + (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
        updateGame(game, 1 / 60, { x, y, attack: touch.attack || keys.has('Space') || keys.has('KeyJ'), dash: touch.dash });
        touch.dash = false; accumulator -= 1 / 60; consumeEvents();
        if (game.mode !== 'playing') { accumulator = 0; break; }
      }
    } else accumulator = 0;
    renderGame(ctx, game, game.elapsed, reducedMotion.matches);
    if (now - hudAt > 80) { updateHud(); hudAt = now; }
  } else if (!document.hidden) renderPreview(previewCtx, now / 1000, reducedMotion.matches);
  requestAnimationFrame(frame);
}

function joystickMove(event) {
  if (event.pointerId !== joystickPointer) return;
  const rect = $('joystick').getBoundingClientRect();
  let dx = event.clientX - rect.left - rect.width / 2, dy = event.clientY - rect.top - rect.height / 2;
  const radius = rect.width * .31, length = Math.hypot(dx, dy);
  if (length > radius) { dx *= radius / length; dy *= radius / length; }
  touch.x = dx / radius; touch.y = dy / radius;
  $('joystick-knob').style.transform = `translate(${dx}px, ${dy}px)`;
}

$('joystick').addEventListener('pointerdown', event => {
  if (game?.mode !== 'playing' || joystickPointer !== null) return;
  event.preventDefault(); joystickPointer = event.pointerId; $('joystick').setPointerCapture(event.pointerId); joystickMove(event);
});
$('joystick').addEventListener('pointermove', joystickMove);
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) $('joystick').addEventListener(name, event => {
  if (event.pointerId !== joystickPointer) return;
  joystickPointer = null; touch.x = 0; touch.y = 0; $('joystick-knob').style.transform = '';
});
$('attack').addEventListener('pointerdown', event => {
  if (game?.mode !== 'playing' || attackPointer !== null) return;
  event.preventDefault(); unlockAudio(); attackPointer = event.pointerId; touch.attack = true; $('attack').setPointerCapture(event.pointerId); $('attack').classList.add('pressed');
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) $('attack').addEventListener(name, event => {
  if (event.pointerId !== attackPointer) return;
  attackPointer = null; touch.attack = false; $('attack').classList.remove('pressed');
});
$('dash').addEventListener('pointerdown', event => {
  if (game?.mode !== 'playing' || dashPointer !== null) return;
  event.preventDefault(); unlockAudio(); dashPointer = event.pointerId; touch.dash = true; $('dash').setPointerCapture(event.pointerId); $('dash').classList.add('pressed');
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) $('dash').addEventListener(name, event => {
  if (event.pointerId !== dashPointer) return;
  dashPointer = null; $('dash').classList.remove('pressed');
});
// Native keyboard activation of the on-screen action buttons remains supported.
$('attack').addEventListener('click', event => { if (!event.detail && game?.mode === 'playing') { unlockAudio(); touch.attack = true; setTimeout(() => { touch.attack = false; }, 100); } });
$('dash').addEventListener('click', event => { if (!event.detail && game?.mode === 'playing') { unlockAudio(); touch.dash = true; } });

window.addEventListener('keydown', event => {
  if ($('modal').open || !game) return;
  if (['Escape', 'KeyP'].includes(event.code)) { event.preventDefault(); showPause(); return; }
  if (game.mode !== 'playing') return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyJ', 'KeyK', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
    event.preventDefault(); unlockAudio(); keys.add(event.code);
    if (!event.repeat && ['ShiftLeft', 'ShiftRight', 'KeyK'].includes(event.code)) touch.dash = true;
  }
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => { audio.setBackground(true); clearInput(); showPause(); });
window.addEventListener('focus', () => { if (!document.hidden) audio.setBackground(false); });
document.addEventListener('visibilitychange', () => {
  audio.setBackground(document.hidden || !document.hasFocus());
  if (document.hidden) { clearInput(); showPause(); }
});
$('modal').addEventListener('cancel', event => {
  event.preventDefault();
  if (modalKind === 'help') closeHelp();
  else if (modalKind === 'pause') { closeModal(); resumeGame(game); audio.setPaused(false); unlockAudio(); }
});
$('sound').addEventListener('click', toggleSound);
for (const id of ['help', 'lobby-help', 'sidebar-help']) $(id).addEventListener('click', () => { unlockAudio(); showHelp(); audio.play('ui_confirm'); });
$('pause').addEventListener('click', () => { showPause(); audio.play('ui_confirm'); });
$('continue').addEventListener('click', () => start(saved));
$('start').addEventListener('click', () => {
  if (!saved) { start(); return; }
  setModal('restart', 'NUEVO CONCURSANTE. EL MISMO, EN REALIDAD.', '¿Volvemos al primer piso?', 'Se sustituirá el progreso guardado de esta partida.');
  audio.play('ui_confirm');
  modalButton('Empezar desde cero', () => start(), false, false); modalButton('Conservar mi partida', closeModal, true);
});
async function boot() {
  try {
    await loadArt((loaded, total) => { $('asset-status').textContent = `Preparando el espectáculo… ${Math.round(loaded / total * 100)} %`; });
    artReady = true; readSave();
    $('start').disabled = false; $('continue').disabled = false; $('asset-status').hidden = true;
    requestAnimationFrame(frame);
  } catch {
    $('asset-status').textContent = 'No se ha podido cargar la mazmorra. Comprueba la conexión y recarga la página.';
    $('start').textContent = 'Recargar la mazmorra'; $('start').disabled = false;
    $('start').addEventListener('click', () => location.reload(), { once: true, capture: true });
  }
}
boot();
