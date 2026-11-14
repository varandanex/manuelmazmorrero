// Run with the same local-only fixture as mobile-regression.js.
(async () => {
  const q = window.__uiQa, results = [];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = (name, pass) => results.push({ name, pass: !!pass });
  const key = (type, repeat = false) => {
    const event = new KeyboardEvent(type, { code: 'Space', key: ' ', bubbles: true, cancelable: true, repeat });
    document.dispatchEvent(event); return event;
  };
  const pointer = (type, id) => window.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', bubbles: true, cancelable: true }));
  for (const kind of ['upgrade', 'dead', 'won']) {
    q.start(); key('keydown'); q.result(kind);
    await wait(1150);
    document.querySelector(q.state.modal === 'upgrade' ? '.upgrade-option' : '#modal-actions button').click();
    check(`${kind}: held attack cannot select even after delay`, q.state.modal === kind);
    check(`${kind}: title receives focus instead of an action`, document.activeElement.id === 'modal-title');
    key('keyup');
    document.querySelector(q.state.modal === 'upgrade' ? '.upgrade-option' : '#modal-actions button').click();
    check(`${kind}: release cannot activate a result action`, q.state.modal === kind);
    await wait(250);
    check(`${kind}: actions unlock after release`, !document.getElementById('modal-content').inert);
    const repeated = key('keydown', true);
    check(`${kind}: repeated keyboard activation stays blocked`, repeated.defaultPrevented);
    key('keyup');
    document.querySelector(q.state.modal === 'upgrade' ? '.upgrade-option' : '#modal-actions button').click();
    check(`${kind}: a fresh choice works`, q.state.modal === 'floor-intro' && q.state.mode === 'floor-intro');
  }
  q.start(); pointer('pointerdown', 101); pointer('pointerdown', 102); q.result('upgrade');
  await wait(1150); pointer('pointerup', 102); await wait(250);
  document.querySelector(q.state.modal === 'upgrade' ? '.upgrade-option' : '#modal-actions button').click();
  check('two fingers: releasing attack alone cannot dismiss the result', q.state.modal === 'upgrade');
  pointer('pointercancel', 101); await wait(250);
  document.querySelector(q.state.modal === 'upgrade' ? '.upgrade-option' : '#modal-actions button').click();
  check('two fingers: cancellation releases the final held input', q.state.floor === 1);
  q.start(); q.result('dead'); await wait(1150);
  check('idle result unlocks without extra interaction', !document.getElementById('modal-actions').inert);
  q.menu();
  return results;
})()
