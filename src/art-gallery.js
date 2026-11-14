import { GALLERY_ART, ART_ARCHIVE } from './art-gallery-data.js';

export function galleryIndex(index, delta, count = GALLERY_ART.length) {
  return ((index + delta) % count + count) % count;
}

export function formatArtSize(bytes) {
  return `${(bytes / 1048576).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`;
}

export function initArtGallery(trigger, onNavigate = () => {}) {
  let dialog, index = 0, revision = 0, swipe = null;
  const $ = id => dialog.querySelector(`#${id}`);

  function render() {
    const item = GALLERY_ART[index], current = ++revision;
    const image = new Image(); image.alt = item.name; image.draggable = false;
    image.decoding = 'async'; image.hidden = true;
    $('gallery-image').replaceChildren(image);
    $('gallery-stage').setAttribute('aria-busy', 'true');
    $('gallery-image-status').textContent = 'Cargando ilustración…';
    $('gallery-image-status').hidden = false; $('gallery-retry').hidden = true;
    $('gallery-name').textContent = item.name;
    $('gallery-position').textContent = `${index + 1} / ${GALLERY_ART.length} · ${item.category}`;
    $('gallery-meta').textContent = `${item.width} × ${item.height} px · PNG · ${formatArtSize(item.bytes)}`;
    $('gallery-png').href = `${item.original}?download=1`;
    $('gallery-png').download = item.filename;
    $('gallery-png').setAttribute('aria-label', `Descargar PNG original de ${item.name}`);
    image.onload = () => {
      if (current !== revision || !dialog.open) return;
      image.hidden = false; $('gallery-stage').setAttribute('aria-busy', 'false');
      $('gallery-image-status').hidden = true;
    };
    image.onerror = () => {
      if (current !== revision || !dialog.open) return;
      $('gallery-stage').setAttribute('aria-busy', 'false');
      $('gallery-image-status').textContent = 'No se ha podido cargar la vista previa. Puedes reintentar o descargar el PNG.';
      $('gallery-retry').hidden = false;
    };
    image.src = item.preview;
  }

  function move(delta) {
    index = galleryIndex(index, delta); render(); onNavigate();
  }

  function create() {
    dialog = document.createElement('dialog'); dialog.id = 'art-gallery';
    dialog.setAttribute('aria-labelledby', 'gallery-title');
    // Static markup only. Catalog labels and URLs are assigned through DOM properties.
    dialog.innerHTML = `<div class="gallery-inner">
      <header class="gallery-header"><div><span class="eyebrow">ARCHIVO DEL DESASTRE</span><h2 id="gallery-title" tabindex="-1">Galería de ilustraciones</h2></div><button id="gallery-close" class="icon-button" type="button" aria-label="Volver al menú" title="Volver al menú">×</button></header>
      <div id="gallery-stage" class="gallery-stage" aria-busy="true"><div id="gallery-image" class="gallery-image"></div><div class="gallery-feedback"><p id="gallery-image-status" role="status"></p><button id="gallery-retry" class="text-button" type="button" hidden>Reintentar vista previa</button></div></div>
      <div class="gallery-navigation"><button id="gallery-previous" class="icon-button" type="button" aria-label="Imagen anterior">←</button><div class="gallery-caption" aria-live="polite" aria-atomic="true"><p id="gallery-position"></p><h3 id="gallery-name"></h3><p id="gallery-meta"></p></div><button id="gallery-next" class="icon-button" type="button" aria-label="Imagen siguiente">→</button></div>
      <div class="gallery-downloads"><a id="gallery-png" class="gallery-download" download><strong>PNG original</strong><span>Solo esta imagen</span></a><a id="gallery-zip" class="gallery-download gallery-download-all" download><strong>Todo en ZIP</strong><span id="gallery-zip-meta"></span></a></div>
      <p class="gallery-note">Desliza o usa ← →. Descargas originales, sin reducir ni recomprimir.</p>
    </div>`;
    document.body.append(dialog);
    $('gallery-zip').href = ART_ARCHIVE.url; $('gallery-zip').download = ART_ARCHIVE.filename;
    $('gallery-zip-meta').textContent = `${ART_ARCHIVE.count} PNG · ${formatArtSize(ART_ARCHIVE.bytes)}`;
    $('gallery-close').addEventListener('click', () => dialog.close());
    $('gallery-previous').addEventListener('click', () => move(-1));
    $('gallery-next').addEventListener('click', () => move(1));
    $('gallery-retry').addEventListener('click', render);
    dialog.addEventListener('close', () => {
      revision++; swipe = null; $('gallery-image').replaceChildren(); trigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') move(event.key === 'ArrowRight' ? 1 : -1);
      else { index = event.key === 'Home' ? 0 : GALLERY_ART.length - 1; render(); onNavigate(); }
    });
    const stage = $('gallery-stage');
    stage.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest('button')) { swipe = null; return; }
      swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointerup', event => {
      if (!swipe || swipe.id !== event.pointerId) return;
      const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
      swipe = null;
      if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4) move(dx < 0 ? 1 : -1);
    });
    for (const type of ['pointercancel', 'lostpointercapture']) stage.addEventListener(type, () => { swipe = null; });
  }

  trigger.addEventListener('click', () => {
    if (!dialog) create();
    dialog.showModal(); render(); $('gallery-title').focus({ preventScroll: true }); onNavigate();
  });
}
