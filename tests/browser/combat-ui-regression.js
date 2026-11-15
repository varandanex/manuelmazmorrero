// Run in the local page with ui-fixture.js appended to the main module response.
(async () => {
  const q = window.__uiQa, results = [];
  const $ = id => document.getElementById(id);
  const check = (name, pass) => results.push({ name, pass: !!pass });
  await document.fonts.load('600 24px "Pixelify Sans"', 'Ññ Áé ¡Música!');
  check('local pixel font loads with Spanish text', document.fonts.check('600 24px "Pixelify Sans"'));
  for (const floor of [0, 1, 2, 3, 4]) {
    for (const phase of ['mobs', 'boss']) {
      q.scene(phase, floor);
      check(`${floor}/${phase}: no prose during combat`, !/[a-záéíóúñ]/i.test($('game-screen').innerText));
      check(`${floor}/${phase}: no transition overlay`, $('floor-toast').hidden);
      check(`${floor}/${phase}: player health remains accessible`, $('health-bar').getAttribute('aria-label') === 'Vida de Manolo');
    }
    q.scene('intro', floor);
    check(`${floor}: floor title is limited to its transition`, !$('floor-toast').hidden && $('room-name').textContent.length > 0);
    q.scene('warning', floor);
    check(`${floor}: boss warning does not duplicate the conversation`, $('floor-toast').hidden);
  }
  for (const [floor, mode, expected] of [[0,'idle',''], [0,'recover','vulnerable'], [0,'windup','danger'], [4,'idle','shield'], [2,'windup','danger'], [3,'recover','vulnerable']]) {
    q.scene('boss', floor, mode);
    check(`boss state uses the ${expected || 'idle'} indicator`, $('boss-state').dataset.state === expected);
    check('boss bar has its actual health range', Number($('boss-bar').getAttribute('aria-valuemax')) >= 340);
  }
  for (const kind of ['projectiles', 'hazards']) {
    q.scene('warning'); q.danger(kind);
    check(`leftover ${kind} are never covered by a title card`, $('floor-toast').hidden);
  }
  q.scene('mobs', 1); q.resume(); $('pause').click();
  check('pause retains the floor, boss hint, perks and commentary',
    $('modal-content').textContent.includes('La Acaparadora') && $('modal-content').textContent.includes('Violencia administrativa') && !!document.querySelector('.pause-summary blockquote'));
  check('pause retains time and score', !!document.querySelector('.result-grid'));
  check('resume comes before the detailed pause content', !!($('modal-actions').compareDocumentPosition($('modal-content')) & Node.DOCUMENT_POSITION_FOLLOWING));
  check('menu titles use the pixel font', getComputedStyle($('modal-title')).fontFamily.includes('Pixelify Sans'));
  check('long copy keeps the readable body font', getComputedStyle($('modal-copy')).fontFamily.includes('Inter'));
  [...$('modal-actions').children].find(el => el.textContent === 'Consultar controles').click();
  check('help explains the icon-only controls', $('modal-content').textContent.includes('paraguas') && $('modal-content').textContent.includes('dos flechas'));
  $('modal-actions').querySelector('button').click();
  check('help entered from pause can return to play', q.state.mode === 'playing' && q.state.modal === '');
  for (const kind of ['upgrade', 'dead', 'won']) {
    q.start(); q.result(kind);
    const narrative = kind === 'won' ? document.querySelector('.victory-reward')?.alt : $('modal-copy').textContent;
    check(`${kind}: narrative remains in the result screen`, $('modal').open && narrative?.length > 20);
    check(`${kind}: accidental input guard remains enabled`, $('modal-actions').inert);
  }
  q.menu();
  return results;
})()
