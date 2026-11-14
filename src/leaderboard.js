function submissionId() {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function addLeaderboard(container, score = null) {
  const section = document.createElement('section'); section.className = 'leaderboard';
  const title = document.createElement('h3'); title.textContent = 'TOP 10 · SALÓN DE LA FAMA';
  const status = document.createElement('p'); status.className = 'quiet-note'; status.setAttribute('role', 'status');
  const list = document.createElement('ol'); list.className = 'leaderboard-list'; list.setAttribute('aria-label', 'Clasificación de jugadores');
  section.append(title, status, list); container.append(section);
  const id = submissionId();
  function render(entries) {
    list.replaceChildren();
    for (const entry of entries) {
      const row = document.createElement('li'), initials = document.createElement('strong'), points = document.createElement('span');
      initials.textContent = entry.initials; points.textContent = `${entry.score} pts`;
      if (entry.id === id) { row.className = 'leaderboard-current'; row.setAttribute('aria-label', `${entry.initials}, ${entry.score} puntos, tu puntuación`); }
      row.append(initials, points); list.append(row);
    }
  }
  async function request(options) {
    const response = await fetch('/api/leaderboard', { ...options, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Leaderboard unavailable');
    return (await response.json()).entries;
  }
  let submitting = false;
  async function load() {
    status.textContent = 'Cargando clasificación…';
    try {
      const entries = await request();
      if (!section.isConnected || submitting) return;
      render(entries); status.textContent = entries.length ? 'En los empates, la nueva marca queda por delante.' : 'Todavía no hay marcas. ¡Estrena el ranking!';
    } catch { if (section.isConnected && !submitting) status.textContent = 'No se ha podido cargar el ranking. Puedes seguir jugando.'; }
  }
  if (score !== null) {
    const form = document.createElement('form'); form.className = 'leaderboard-form';
    const label = document.createElement('label'); label.textContent = 'Tus iniciales (1–3 letras o números)';
    const input = document.createElement('input'); input.name = 'initials'; input.maxLength = 3; input.minLength = 1; input.required = true; input.pattern = '[A-Za-z0-9]{1,3}'; input.autocomplete = 'off'; input.autocapitalize = 'characters'; input.spellcheck = false;
    input.addEventListener('input', () => { input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3); });
    label.append(input);
    const button = document.createElement('button'); button.type = 'submit'; button.className = 'primary-button'; button.textContent = 'Guardar marca';
    form.append(label, button); section.append(form);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting || !form.reportValidity()) return;
      submitting = true; button.disabled = true; input.disabled = true; status.textContent = 'Guardando marca…';
      try {
        const entries = await request({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, initials: input.value.toUpperCase(), score }) });
        if (!section.isConnected) return;
        render(entries); form.remove();
        status.textContent = entries.some(entry => entry.id === id) ? '¡Marca guardada! Ya formas parte del top 10.' : 'Tu marca no entra en el top 10. ¡Otra ronda!';
      } catch {
        if (!section.isConnected) return;
        status.textContent = 'No se ha podido guardar. Vuelve a intentarlo.';
        submitting = false; button.disabled = false; input.disabled = false;
      }
    });
  }
  void load();
}
