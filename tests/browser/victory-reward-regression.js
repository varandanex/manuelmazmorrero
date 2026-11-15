// Evaluate with ui-fixture.js appended only to the local main module response.
(async () => {
  const q = window.__uiQa, results = [];
  const $ = id => document.getElementById(id);
  const check = (name, pass) => results.push({ name, pass: !!pass });
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (const kind of ['upgrade', 'dead']) {
    q.start(); q.result(kind);
    check(`${kind}: does not reveal the gift`, !document.querySelector('.victory-reward'));
  }
  q.start(); q.result('won');
  const image = document.querySelector('.victory-reward');
  check('victory is still guarded against the last combat input', $('modal-actions').inert);
  check('the reward stays fully visible during the guard', getComputedStyle($('modal-content')).opacity === '1');
  await image.decode();
  check('the original poster loads at its full native resolution', image.naturalWidth === 992 && image.naturalHeight === 1072);
  check('the poster is the first result, above the score', $('modal-content').firstElementChild === image.parentElement);
  check('the original message is accessible without rewriting its reward', image.alt.includes('+100 € en créditos de PlayStation Store') && image.alt.includes('¡EL SHOW DEBE CONTINUAR!'));
  check('the previous birthday copy is removed', !$('modal').textContent.includes('Feliz cumpleaños') && !$('modal-copy').textContent);
  check('the dialog retains an accessible title and safe initial focus', $('modal-title').textContent === '¡Bono de fidelización del mazmorrero!' && document.activeElement === $('modal-title'));
  check('the original can be opened without losing the result', image.parentElement.href === image.src && image.parentElement.target === '_blank' && image.parentElement.rel === 'noopener');
  check('time, score and ranking remain available', !!document.querySelector('.result-grid') && !!document.querySelector('.leaderboard'));
  check('victory stops combat and clears the checkpoint', q.state.mode === 'won' && localStorage.getItem('manu-dungeon-checkpoint-v1') === null);
  $('modal').dispatchEvent(new Event('cancel', { cancelable: true }));
  check('Escape cannot accidentally dismiss the reward', $('modal').open && q.state.modal === 'won');
  await wait(1200);
  $('modal-actions').firstElementChild.click();
  check('replaying starts a new run without the gift poster', q.state.mode === 'floor-intro' && !document.querySelector('.victory-reward'));
  q.skipBriefing(); q.result('won'); await wait(1200);
  $('modal-actions').lastElementChild.click();
  check('return to menu remains available', !$('lobby').hidden && !$('modal').open && $('continue').hidden);
  return results;
})()
