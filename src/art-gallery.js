import { CARD_DOWNLOADS, ART_ARCHIVE } from './art-gallery-data.js';
import { characterCards, createCharacterCard } from './character-cards.js';

const profiles = characterCards();
export function galleryIndex(index, delta, count = profiles.length) {
  return ((index + delta) % count + count) % count;
}
export function formatArtSize(bytes) {
  return `${(bytes / 1048576).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`;
}

export function initArtGallery(trigger, onNavigate = () => {}) {
  let dialog, index = 0, revision = 0, swipe = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let moving = !reducedMotion.matches;
  reducedMotion.addEventListener('change', event => { if (event.matches) moving = false; if (dialog) updateMotion(); });
  const $ = id => dialog.querySelector(`#${id}`);

  function updateMotion() {
    dialog.classList.toggle('gallery-animated', moving);
    if ($('gallery-motion')) {
      $('gallery-motion').textContent = reducedMotion.matches ? 'Movimiento reducido' : moving ? 'Pausar movimiento' : 'Animar a Manolo';
      $('gallery-motion').disabled = reducedMotion.matches;
      $('gallery-motion').setAttribute('aria-pressed', String(moving));
    }
  }

  function render() {
    const restoreCardFocus = $('gallery-card').contains(document.activeElement);
    const profile = profiles[index], file = CARD_DOWNLOADS.find(item => item.id === profile.id), current = ++revision;
    const card = createCharacterCard(profile), portrait = card.querySelector('.cc-portrait'), image = card.querySelector('img');
    image.hidden = true;
    const feedback = document.createElement('div'); feedback.className = 'gallery-feedback';
    feedback.innerHTML = '<p id="gallery-image-status" role="status">Cargando ilustración…</p><button id="gallery-retry" class="text-button" type="button" hidden>Reintentar vista previa</button>';
    portrait.append(feedback);
    const utilities = document.createElement('div'); utilities.className = 'gallery-portrait-actions';
    const original = document.createElement('a'); original.id = 'gallery-original'; original.textContent = 'PNG sin ficha';
    original.href = `${profile.original}?download=1`; original.download = profile.original.split('/').at(-1);
    original.setAttribute('aria-label', `Descargar ilustración original de ${profile.name}, sin ficha`); utilities.append(original);
    if (profile.kind === 'hero') {
      const motion = document.createElement('button'); motion.type = 'button'; motion.id = 'gallery-motion';
      motion.addEventListener('click', () => { moving = !moving; updateMotion(); }); utilities.append(motion);
    }
    card.querySelector('.cc-details').prepend(utilities);
    $('gallery-card').replaceChildren(card); $('gallery-stage').scrollTop = 0;
    $('gallery-stage').setAttribute('aria-busy', 'true');
    $('gallery-position').textContent = `${index + 1} / ${profiles.length} · ${profile.category}`;
    $('gallery-name').textContent = profile.name;
    $('gallery-meta').textContent = `${file.width} × ${file.height} px · ${formatArtSize(file.bytes)}`;
    $('gallery-png').href = `${file.url}?download=1`; $('gallery-png').download = file.filename;
    $('gallery-png').setAttribute('aria-label', `Descargar ficha PNG de ${profile.name}`);
    $('gallery-retry').addEventListener('click', render);
    updateMotion();
    // Arrow navigation can remove the focused original-download/motion control.
    // Keep keyboard focus inside the dialog so subsequent navigation still works.
    if (restoreCardFocus) $('gallery-stage').focus({ preventScroll: true });
    image.onload = () => {
      if (current !== revision || !dialog.open) return;
      image.hidden = false; $('gallery-stage').setAttribute('aria-busy', 'false'); feedback.hidden = true;
    };
    image.onerror = () => {
      if (current !== revision || !dialog.open) return;
      $('gallery-stage').setAttribute('aria-busy', 'false');
      $('gallery-image-status').textContent = 'No se ha podido cargar la ilustración. La ficha se puede descargar igualmente.';
      $('gallery-retry').hidden = false;
    };
    // A decoded cache hit may finish before the detached card is inserted.
    if (image.complete && image.naturalWidth) image.onload();
  }

  function move(delta) { index = galleryIndex(index, delta); render(); onNavigate(); }

  function create() {
    dialog = document.createElement('dialog'); dialog.id = 'art-gallery';
    dialog.setAttribute('aria-labelledby', 'gallery-title');
    dialog.innerHTML = `<div class="gallery-inner">
      <header class="gallery-header"><div><span class="eyebrow">COLECCIÓN DEL DESASTRE</span><h2 id="gallery-title" tabindex="-1">Fichas de personaje</h2></div><button id="gallery-close" class="icon-button" type="button" aria-label="Volver al menú" title="Volver al menú">×</button></header>
      <div id="gallery-stage" class="gallery-stage" tabindex="0" aria-label="Ficha de personaje. Desplázate verticalmente para leerla." aria-busy="true"><div id="gallery-card"></div></div>
      <div class="gallery-navigation"><button id="gallery-previous" class="icon-button" type="button" aria-label="Ficha anterior">←</button><div class="gallery-caption" aria-live="polite" aria-atomic="true"><p id="gallery-position"></p><h3 id="gallery-name"></h3><p id="gallery-meta"></p></div><button id="gallery-next" class="icon-button" type="button" aria-label="Ficha siguiente">→</button></div>
      <div class="gallery-downloads"><a id="gallery-png" class="gallery-download" download><strong>Ficha PNG</strong><span>Personaje + estadísticas</span></a><a id="gallery-zip" class="gallery-download gallery-download-all" download><strong>Todas en ZIP</strong><span id="gallery-zip-meta"></span></a></div>
      <p class="gallery-note">Desliza ↑ para leer · ← → cambia de ficha. PNG estáticos.</p>
    </div>`;
    document.body.append(dialog);
    $('gallery-zip').href = ART_ARCHIVE.url; $('gallery-zip').download = ART_ARCHIVE.filename;
    $('gallery-zip-meta').textContent = `${ART_ARCHIVE.count} fichas · ${formatArtSize(ART_ARCHIVE.bytes)}`;
    $('gallery-close').addEventListener('click', () => dialog.close());
    $('gallery-previous').addEventListener('click', () => move(-1));
    $('gallery-next').addEventListener('click', () => move(1));
    dialog.addEventListener('close', () => {
      revision++; swipe = null; $('gallery-card').replaceChildren(); trigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') move(event.key === 'ArrowRight' ? 1 : -1);
      else { index = event.key === 'Home' ? 0 : profiles.length - 1; render(); onNavigate(); }
    });
    const stage = $('gallery-stage');
    stage.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest('button,a')) { swipe = null; return; }
      swipe = { id: event.pointerId, x: event.clientX, y: event.clientY }; stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointerup', event => {
      if (!swipe || swipe.id !== event.pointerId) return;
      const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y; swipe = null;
      if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4) move(dx < 0 ? 1 : -1);
    });
    for (const type of ['pointercancel', 'lostpointercapture']) stage.addEventListener(type, () => { swipe = null; });
  }
  trigger.addEventListener('click', () => {
    if (!dialog) create();
    dialog.showModal(); render(); $('gallery-title').focus({ preventScroll: true }); onNavigate();
  });
}
