import { addLeaderboard } from './leaderboard.js';
import { initArtGallery } from './art-gallery.js';
import { createGame, updateGame, chooseUpgrade, retryFloor, pauseGame, resumeGame, beginFloorCombat, beginBossReveal, beginBossFight, parseCheckpoint, formatTime, FLOORS, UPGRADES } from './game.js';
import { loadArt, renderGame, renderPreview } from './render.js';
import { createAudio } from './audio.js';
import { createTransitionGuard } from './transition-guard.js';
import { BOSS_DIALOGUES } from './boss-dialogues.js';
import { ENCOUNTER_CARDS, FLOOR_BRIEFINGS, floorEnemyCards } from './encounter-cards.js';

const $ = id => document.getElementById(id);
const canvas = $('arena');
const ctx = canvas.getContext('2d');
const previewCtx = $('preview').getContext('2d');
const storageKey = 'manu-dungeon-checkpoint-v1';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const keys = new Set();
const transitionGuard = createTransitionGuard();
const touch = { x: 0, y: 0, attack: false, dash: false };
let game = null, saved = null, lastFrame = 0, accumulator = 0, hudAt = 0;
let modalKind = '', helpWasPlaying = false, lastNarrator = '';
let bossDialogueIndex = 0;
let encounterIndex = -1;
let joystickPointer = null, attackPointer = null, dashPointer = null;
let artReady = false;
const audio = createAudio({ onChange: updateSoundLabel });
try { audio.setVolumes(JSON.parse(localStorage.getItem('manolo-audio-volumes-v1')) || {}); } catch { /* Audio remains usable without storage. */ }
updateSoundLabel();

function readSave() {
  try { saved = parseCheckpoint(localStorage.getItem(storageKey)); } catch { saved = null; }
  $('continue').hidden = !saved;
  if (saved) $('continue').querySelector('span').textContent = `Continuar · Piso ${saved.floor + 1}`;
  $('start').classList.toggle('entry-primary', !saved);
  $('start').classList.toggle('entry-secondary', !!saved);
  $('start-label').textContent = saved ? 'Nueva partida' : 'Entrar en la mazmorra';
}

function saveCheckpoint() {
  try { localStorage.setItem(storageKey, JSON.stringify(game.stageCheckpoint)); } catch { /* The game remains playable with storage disabled. */ }
}

function clearSave() {
  saved = null;
  try { localStorage.removeItem(storageKey); } catch { /* Private mode can reject storage. */ }
}

function unlockAudio() { void audio.unlock(); }

// Start on the first browser-authorized interaction, without a separate sound toggle.
// Bubble after button actions so choosing mute never briefly starts playback.
window.addEventListener('click', unlockAudio);
window.addEventListener('keydown', event => {
  if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) unlockAudio();
});

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
  for (const [id, pointer] of [['joystick', joystickPointer], ['attack', attackPointer], ['dash', dashPointer]]) {
    if (pointer !== null && $(id).hasPointerCapture(pointer)) $(id).releasePointerCapture(pointer);
  }
  keys.clear(); touch.x = 0; touch.y = 0; touch.attack = false; touch.dash = false;
  joystickPointer = null; attackPointer = null; dashPointer = null;
  $('joystick-knob').style.transform = ''; $('attack').classList.remove('pressed'); $('dash').classList.remove('pressed');
}

function setModal(kind, eyebrow, title, copy) {
  clearInput(); modalKind = kind;
  if (['upgrade', 'dead', 'won', 'boss-intro', 'floor-intro', 'boss-reveal'].includes(kind)) transitionGuard.begin();
  else transitionGuard.close();
  $('modal-eyebrow').textContent = eyebrow; $('modal-title').textContent = title; $('modal-copy').textContent = copy;
  $('modal-content').replaceChildren(); $('modal-actions').replaceChildren();
  $('modal-content').after($('modal-actions'));
  $('modal').dataset.kind = kind;
  delete $('modal').dataset.presentation;
  updateModalLock();
  if (!$('modal').open) $('modal').showModal();
  $('modal').scrollTop = 0;
  $('modal-title').focus({ preventScroll: true });
  syncGestureMode();
}

function modalButton(label, action, secondary = false, confirm = true) {
  const button = document.createElement('button'); button.type = 'button'; button.className = secondary ? 'text-button' : 'primary-button'; button.textContent = label;
  button.addEventListener('click', () => { unlockAudio(); action(); if (confirm) audio.play('ui_confirm'); }); $('modal-actions').append(button); return button;
}

function closeModal() {
  transitionGuard.close(); updateModalLock(); $('modal').close(); modalKind = ''; clearInput();
}

function updateModalLock() {
  const locked = transitionGuard.isLocked();
  // The illustrated conversation stays readable while only advancement is locked.
  $('modal-content').inert = locked && !['boss-intro', 'floor-intro', 'boss-reveal'].includes(modalKind); $('modal-actions').inert = locked;
  $('transition-status').hidden = !locked;
  $('modal').classList.toggle('transition-locked', locked);
}

function isCombatActive() { return game?.mode === 'playing' && !$('modal').open; }
function syncGestureMode() { document.documentElement.classList.toggle('in-combat', isCombatActive()); }

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
  modalButton('Consultar controles', showHelp, true);
  modalButton('Volver al menú', backToMenu, true);
  // Resume stays reachable without scrolling through the moved combat details.
  $('modal-content').before($('modal-actions'));
  const summary = document.createElement('section'); summary.className = 'pause-summary';
  const title = document.createElement('h3'); title.textContent = `Piso 0${game.floor + 1} · ${FLOORS[game.floor].name}`;
  const hint = document.createElement('p'); hint.textContent = `${FLOORS[game.floor].boss}: ${FLOORS[game.floor].hint}`;
  const perks = document.createElement('p'); perks.className = 'pause-perks';
  perks.textContent = `Ventajas: ${game.perks.length ? game.perks.map(id => UPGRADES.find(u => u.id === id).name).join(' · ') : 'Tu optimismo. De momento.'}`;
  summary.append(title, hint, perks);
  if (lastNarrator) { const quote = document.createElement('blockquote'); quote.textContent = lastNarrator; summary.append(quote); }
  $('modal-content').append(summary); addResults();
  const note = document.createElement('p'); note.className = 'quiet-note'; note.textContent = 'Al salir se conserva el inicio del piso actual, no la sala exacta.'; $('modal-content').append(note);
  addAudioControls();
}

function showHelp() {
  helpWasPlaying = game?.mode === 'playing' || modalKind === 'pause';
  if (helpWasPlaying) { pauseGame(game); audio.setPaused(true); }
  setModal('help', 'MANUAL DE SUPERVIVENCIA', 'No mueras. Sobre todo eso.', `Elimina dos oleadas y derrota al jefe de cada uno de los ${FLOORS.length} pisos. Elige una mejora tras los primeros ${FLOORS.length - 1}.`);
  const rows = document.createElement('div'); rows.className = 'help-rows';
  const rules = [
    ['Muévete', 'Móvil: arrastra el joystick izquierdo. Ordenador: WASD o flechas.'],
    ['Ataca de cerca', 'Mantén pulsado el botón amarillo del paraguas o espacio / J. Manolo apunta al enemigo cercano.'],
    ['Esquiva el peligro', 'Pulsa el botón de las dos flechas o Mayús / K. Durante el impulso no recibes daño. El número indica cuánto falta para recargar.'],
    ['Lee al enemigo', 'Las marcas en el suelo y el triángulo avisan de un ataque. El rayo indica que el jefe es vulnerable; el escudo, que debes destruir sus emisores.'],
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

function showFloorIntro() {
  encounterIndex = -1;
  showEncounterCard();
}

function showEncounterCard(step = false) {
  const boss = game.mode === 'boss-reveal', story = !boss && encounterIndex === -1;
  const floor = FLOORS[game.floor], deck = floorEnemyCards(floor);
  const data = story ? FLOOR_BRIEFINGS[game.floor] : boss ? ENCOUNTER_CARDS[floor.bossType] : deck[encounterIndex];
  const kind = boss ? 'boss-reveal' : 'floor-intro';
  if (!audio.status().paused) audio.setPaused(true);
  const label = story ? 'ENTRANDO EN LA MAZMORRA' : boss ? 'JEFE DE PISO' : `ENEMIGO ${encounterIndex + 1} / ${deck.length}`;
  setModal(kind, `PISO 0${game.floor + 1} · ${label}`, story ? floor.name : data.name, '');
  $('modal').dataset.presentation = story ? 'story' : boss ? 'boss' : 'enemy';
  const card = document.createElement('article'); card.className = 'encounter-card';
  const art = document.createElement('div'); art.className = 'encounter-art';
  const image = document.createElement('img'); image.className = 'encounter-figure';
  image.src = `/assets/webp/${story ? 'environments' : 'enemies'}/${data.art}.webp`;
  image.alt = story ? `Escenario de ${floor.name}` : data.name;
  const stamp = document.createElement('span'); stamp.className = 'encounter-stamp'; stamp.textContent = story ? data.stamp : boss ? 'COMBATE ESTELAR' : 'AMENAZA DETECTADA';
  art.append(image, stamp);
  const copy = document.createElement('div'); copy.className = 'encounter-copy';
  if (story) {
    const narrative = document.createElement('p'); narrative.className = 'encounter-story'; narrative.textContent = data.text;
    copy.append(narrative);
  } else {
    const tagline = document.createElement('p'); tagline.className = 'encounter-tagline'; tagline.textContent = data.tagline;
    const attack = document.createElement('section'); attack.className = 'encounter-attack';
    const label = document.createElement('span'); label.className = 'encounter-label'; label.textContent = 'ATAQUE ESPECIAL';
    const title = document.createElement('h3'); title.textContent = data.attack;
    const description = document.createElement('p'); description.textContent = data.description;
    attack.append(label, title, description);
    const tip = document.createElement('p'); tip.className = 'encounter-tip';
    const tipLabel = document.createElement('strong'); tipLabel.textContent = 'CÓMO NO PALMARLA';
    tip.append(tipLabel, document.createTextNode(data.tip));
    copy.append(tagline, attack, tip);
  }
  card.append(art, copy); $('modal-content').append(card);
  const last = encounterIndex === deck.length - 1;
  const next = modalButton(boss ? '¡Al lío!' : story ? 'Ver enemigos' : last ? 'Entrar en el piso' : 'Siguiente enemigo', () => advanceEncounter(true), false, false);
  next.id = 'encounter-next';
  if (step) { transitionGuard.begin(350); updateModalLock(); }
  // Decoding may finish after a fast navigation or a mute. Never play a stale sting.
  void audio.unlock().then(() => {
    if (card.isConnected && modalKind === kind && !document.hidden) audio.playPresentation(story ? 'floor' : boss ? 'boss' : 'enemy');
  });
}

function advanceEncounter(explicit = false) {
  if (transitionGuard.isLocked()) return;
  if (modalKind === 'floor-intro' && game?.mode === 'floor-intro') {
    if (encounterIndex < floorEnemyCards(FLOORS[game.floor]).length - 1) {
      encounterIndex++; showEncounterCard(true); return;
    }
    if (!explicit || !beginFloorCombat(game)) return;
  } else if (modalKind === 'boss-reveal' && game?.mode === 'boss-reveal') {
    if (!explicit || !beginBossFight(game)) return;
  } else return;
  closeModal(); accumulator = 0; lastFrame = performance.now();
  audio.setPaused(false); consumeEvents(); updateHud(); canvas.focus({ preventScroll: true });
}

function showBossIntro() {
  bossDialogueIndex = 0; audio.setPaused(true);
  setModal('boss-intro', `PISO 0${game.floor + 1} · CARA A CARA`, FLOORS[game.floor].boss, '');
  const stage = document.createElement('div'); stage.className = 'duel-stage';
  for (const [speaker, name, src] of [
    ['manolo', 'Manolo', '/assets/webp/hero-manu-umbrella.webp'],
    ['boss', FLOORS[game.floor].boss, `/assets/webp/enemies/${BOSS_DIALOGUES[game.floor].art}.webp`],
  ]) {
    const figure = document.createElement('figure'); figure.className = 'duel-fighter'; figure.dataset.speaker = speaker;
    const portrait = document.createElement('img'); portrait.src = src; portrait.alt = speaker === 'manolo' ? 'Manolo con su paraguas negro cerrado' : name;
    const caption = document.createElement('figcaption'); caption.textContent = name;
    figure.append(portrait, caption); stage.append(figure);
  }
  const speech = document.createElement('div'); speech.className = 'duel-speech'; speech.setAttribute('role', 'status'); speech.setAttribute('aria-atomic', 'true');
  const speaker = document.createElement('strong'); speaker.id = 'duel-speaker';
  const line = document.createElement('p'); line.id = 'duel-line';
  speech.append(speaker, line);
  const progress = document.createElement('p'); progress.id = 'duel-progress'; progress.className = 'quiet-note';
  $('modal-content').append(stage, speech, progress);
  const next = modalButton('Continuar', () => advanceBossIntro(true), false, false); next.id = 'duel-next';
  updateBossDialogue();
}

function updateBossDialogue() {
  const lines = BOSS_DIALOGUES[game.floor].lines, line = lines[bossDialogueIndex];
  $('duel-speaker').textContent = line.speaker === 'manolo' ? 'Manolo' : FLOORS[game.floor].boss;
  $('duel-line').textContent = line.text;
  $('duel-progress').textContent = `${bossDialogueIndex + 1} / ${lines.length}`;
  $('duel-next').textContent = bossDialogueIndex === lines.length - 1 ? 'Ver presentación' : 'Continuar';
  for (const figure of document.querySelectorAll('.duel-fighter')) figure.classList.toggle('is-speaking', figure.dataset.speaker === line.speaker);
}

function advanceBossIntro(revealBoss = false) {
  if (modalKind !== 'boss-intro' || game?.mode !== 'boss-intro' || transitionGuard.isLocked()) return;
  if (bossDialogueIndex < BOSS_DIALOGUES[game.floor].lines.length - 1) {
    bossDialogueIndex++; updateBossDialogue(); audio.play('ui_confirm');
    // Ignore the second click of a double tap and native key repeat.
    $('modal-title').focus({ preventScroll: true });
    transitionGuard.begin(250); updateModalLock(); return;
  }
  if (revealBoss && beginBossReveal(game)) consumeEvents();
}

function showUpgrade() {
  setModal('upgrade', `PISO 0${game.floor + 1} COMPLETADO`, 'Sigues vivo. Qué incómodo.', `La audiencia exige una segunda temporada.
Elige una ventaja. Recuperarás toda la vida.`);
  const list = document.createElement('div'); list.className = 'upgrade-list';
  for (const upgrade of UPGRADES) {
    const button = document.createElement('button'); button.className = 'upgrade-option';
    const icon = document.createElement('img'); icon.className = 'icon'; icon.alt = ''; icon.src = `/assets/icons/${({ power: 'umbrella-closed', swift: 'lightning', heart: 'heart' })[upgrade.id]}.svg`;
    const text = document.createElement('div'), title = document.createElement('strong'), description = document.createElement('small');
    title.textContent = upgrade.name; description.textContent = upgrade.description; text.append(title, description); button.append(icon, text);
    button.addEventListener('click', () => {
      unlockAudio();
      if (chooseUpgrade(game, upgrade.id)) { closeModal(); saveCheckpoint(); consumeEvents(); updateHud(); }
    }); list.append(button);
  }
  $('modal-content').append(list);
}

function showDeath() {
  setModal('dead', 'SEÑAL INTERRUMPIDA', 'Técnicamente, has muerto.', `«Pero has firmado cinco temporadas. Levántate.»
Repite este piso con toda la vida y tus mejoras.`);
  const portrait = document.createElement('img'); portrait.className = 'result-portrait'; portrait.src = '/assets/webp/Manu-02-caos-absoluto.webp'; portrait.alt = 'Manu, sorprendido por el resultado'; $('modal-content').append(portrait);
  addResults();
  addLeaderboard($('modal-content'), game.score);
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
  setModal('won', 'LOGRO DESBLOQUEADO · LEYENDA DE LA MAZMORRA', 'Feliz cumpleaños, mazmorrero.', `Cinco pisos. Cinco jefes. Cero respeto por el reglamento.
«Has sobrevivido, Manolo. Ahora intenta sobrevivir a otro año.»`);
  addResults();
  addLeaderboard($('modal-content'), game.score);
  const note = document.createElement('p'); note.className = 'quiet-note'; note.textContent = `Criaturas derrotadas: ${game.kills} · Reintentos: ${game.deaths}. La organización niega toda responsabilidad.`; $('modal-content').append(note);
  modalButton('Otra ronda de malas decisiones', () => start(), false, false);
  modalButton('Volver al menú', backToMenu, true);
}

function consumeEvents() {
  if (!game) return;
  const events = game.events.splice(0);
  audio.handleEvents(events, game);
  for (const event of events) {
    // Commentary belongs in the pause menu, never over active combat.
    if (event.type === 'narrator') lastNarrator = event.text;
    if (event.type === 'floor-intro') showFloorIntro();
    if (event.type === 'boss-intro') showBossIntro();
    if (event.type === 'boss-reveal') showEncounterCard();
    if (event.type === 'upgrade') showUpgrade();
    if (event.type === 'dead') showDeath();
    if (event.type === 'won') showVictory();
  }
}

function updateHud() {
  syncGestureMode();
  if (!game) return;
  const p = game.player;
  $('health-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  $('health-fill').style.width = `${p.hp / p.maxHp * 100}%`;
  $('health-fill').style.background = p.hp < p.maxHp * .3 ? 'var(--danger)' : 'var(--mint)';
  $('health-bar').setAttribute('aria-valuenow', Math.ceil(p.hp));
  $('health-bar').setAttribute('aria-valuemax', p.maxHp);
  $('floor-label').textContent = `0${game.floor + 1} / 0${FLOORS.length}`;
  $('floor-label').setAttribute('aria-label', `Piso ${game.floor + 1} de ${FLOORS.length}`);
  $('dash').classList.toggle('cooldown', p.dashCooldown > 0);
  $('dash-label').textContent = p.dashCooldown > 0 ? p.dashCooldown.toFixed(1) : '';
  const boss = game.enemies.find(e => e.boss);
  $('boss-hud').hidden = !boss;
  if (boss) {
    $('boss-bar').setAttribute('aria-label', `Vida de ${FLOORS[game.floor].boss}`);
    $('boss-bar').setAttribute('aria-valuenow', Math.ceil(boss.hp));
    $('boss-bar').setAttribute('aria-valuemax', boss.maxHp);
    $('boss-fill').style.width = `${boss.hp / boss.maxHp * 100}%`;
    const state = boss.type === 'host' && game.enemies.some(e => e.type === 'generator') ? 'shield' : boss.mode === 'recover' ? 'vulnerable' : boss.mode === 'windup' ? 'danger' : '';
    $('boss-state').dataset.state = state;
    $('boss-state').hidden = !state;
    $('boss-state').setAttribute('aria-label', { shield: 'Escudo activo', vulnerable: 'Vulnerable', danger: 'Ataque inminente' }[state] || '');
  }
  // Boss introductions have their own illustrated, player-paced conversation.
  const intro = game.phase === 'intro';
  const dangerRemains = game.enemies.length || game.projectiles.length || game.hazards.length;
  $('floor-toast').hidden = !intro || !!dangerRemains;
  if (intro) {
    $('room-number').textContent = `PISO 0${game.floor + 1}`;
    $('room-name').textContent = FLOORS[game.floor].name;
  }
}

function frame(now) {
  syncGestureMode();
  if ($('modal').open) updateModalLock();
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

// Capture physical releases even after clearInput() resets combat controls.
window.addEventListener('pointerdown', event => {
  const locked = transitionGuard.isLocked();
  transitionGuard.hold(`pointer:${event.pointerId}`);
  if ($('modal').open && locked) event.preventDefault();
}, { capture: true, passive: false });
for (const name of ['pointerup', 'pointercancel']) window.addEventListener(name, event => {
  const locked = transitionGuard.isLocked();
  transitionGuard.release(`pointer:${event.pointerId}`);
  if ($('modal').open && locked) event.preventDefault();
}, { capture: true, passive: false });
window.addEventListener('keydown', event => {
  const locked = transitionGuard.isLocked();
  transitionGuard.hold(`key:${event.code}`);
  if ($('modal').open && (locked || event.repeat)) {
    event.preventDefault(); event.stopImmediatePropagation();
  }
}, true);
window.addEventListener('keyup', event => {
  const locked = transitionGuard.isLocked();
  transitionGuard.release(`key:${event.code}`);
  if ($('modal').open && locked) {
    event.preventDefault(); event.stopImmediatePropagation();
  }
}, true);
$('modal').addEventListener('click', event => {
  if (transitionGuard.isLocked()) { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);
$('modal-content').addEventListener('click', () => {
  if (modalKind === 'boss-intro') advanceBossIntro();
  else if (modalKind === 'floor-intro') advanceEncounter();
});
$('modal').addEventListener('keydown', event => {
  if (modalKind === 'boss-intro' && ['Enter', 'Space', 'ArrowRight'].includes(event.code)) {
    event.preventDefault(); event.stopPropagation();
    if (!event.repeat) advanceBossIntro(event.code !== 'ArrowRight' && document.activeElement === $('duel-next'));
  }
  if (['floor-intro', 'boss-reveal'].includes(modalKind) && ['Enter', 'Space', 'ArrowRight'].includes(event.code)) {
    event.preventDefault(); event.stopPropagation();
    if (!event.repeat) advanceEncounter(event.code !== 'ArrowRight' && document.activeElement === $('encounter-next'));
  }
});
// CSS owns standard pointer gestures; these also cover Safari's gesture events.
for (const name of ['gesturestart', 'gesturechange', 'dblclick']) document.addEventListener(name, event => {
  if (isCombatActive()) event.preventDefault();
}, { passive: false });
for (const name of ['touchstart', 'touchmove']) document.addEventListener(name, event => {
  if (isCombatActive() && event.touches.length > 1) event.preventDefault();
}, { passive: false });

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
window.addEventListener('blur', () => { audio.setBackground(true); transitionGuard.resetHeld(); clearInput(); showPause(); });
window.addEventListener('focus', () => { if (!document.hidden) audio.setBackground(false); });
document.addEventListener('visibilitychange', () => {
  audio.setBackground(document.hidden || !document.hasFocus());
  if (document.hidden) { transitionGuard.resetHeld(); clearInput(); showPause(); }
});
$('modal').addEventListener('cancel', event => {
  event.preventDefault();
  if (modalKind === 'leaderboard') closeModal();
  else if (modalKind === 'help') closeHelp();
  else if (modalKind === 'pause') { closeModal(); resumeGame(game); audio.setPaused(false); unlockAudio(); }
});
$('sound').addEventListener('click', toggleSound);
initArtGallery($('gallery'), () => { unlockAudio(); audio.play('ui_confirm'); });
$('leaderboard').addEventListener('click', () => {
  setModal('leaderboard', 'MARCAS COMPARTIDAS', 'Los diez del desastre.', 'Las mejores puntuaciones de todos los jugadores.');
  addLeaderboard($('modal-content'));
  modalButton('Volver al menú', closeModal, true);
});
for (const id of ['help', 'lobby-help']) $(id).addEventListener('click', () => { unlockAudio(); showHelp(); audio.play('ui_confirm'); });
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
