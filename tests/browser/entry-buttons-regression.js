// Evaluate this function in the local page once artwork has loaded.
async function checkEntryButtons(expectedSaved) {
  await document.fonts.ready;
  const $ = id => document.getElementById(id), results = [];
  const check = (name, pass) => results.push({ name, pass: !!pass });
  check('continue visibility matches the checkpoint', $('continue').hidden === !expectedSaved);
  check('new game retains its button class', $('start').classList.contains('entry-button'));
  check('new game has the correct visual priority', $('start').classList.contains(expectedSaved ? 'entry-secondary' : 'entry-primary'));
  check('new game has a concise label', $('start-label').textContent === (expectedSaved ? 'Nueva partida' : 'Entrar en la mazmorra'));
  check('new game keeps its icon after save refresh', !!$('start').querySelector('svg'));
  const buttons = [...document.querySelectorAll('.entry-actions button')].filter(button => !button.hidden);
  check('the expected actions are available', buttons.length === (expectedSaved ? 3 : 2));
  const rects = buttons.map(button => button.getBoundingClientRect());
  check('every action is a large tap target', rects.every(rect => rect.height >= 56));
  check('all actions use the same full width', rects.every(rect => Math.abs(rect.width - rects[0].width) < 1));
  check('actions are clearly separated', rects.slice(1).every((rect, i) => rect.top - rects[i].bottom >= 10));
  check('all actions have visible borders', buttons.every(button => getComputedStyle(button).borderTopWidth === '2px'));
  check('buttons do not overflow horizontally', rects.every(rect => rect.left >= 0 && rect.right <= innerWidth));
  check('button labels and icons fit their boxes', buttons.every(button => button.scrollWidth <= button.clientWidth));
  check('pixel typography is preserved', buttons.every(button => getComputedStyle(button).fontFamily.includes('Pixelify Sans')));
  if (expectedSaved) {
    check('continue has a distinct fill', getComputedStyle($('continue')).backgroundColor !== getComputedStyle($('start')).backgroundColor);
    check('rules have their own border treatment', getComputedStyle($('lobby-help')).borderColor !== getComputedStyle($('start')).borderColor);
  }
  return results;
}
