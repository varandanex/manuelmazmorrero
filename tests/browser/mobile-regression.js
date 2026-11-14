// Run in the local page after installing ui-fixture.js. Uses the actual DOM handlers.
(async () => {
  const q = window.__uiQa;
  const results = [];
  const check = (name, ok, detail) => results.push({ name, pass: !!ok, detail });
  q.boss();
  const arena = document.querySelector('.arena-wrap').getBoundingClientRect();
  check('portrait arena uses the viewport width', arena.width >= innerWidth - 16,
    { viewport: innerWidth, arena: arena.width });
  check('controls remain visible', document.getElementById('attack').getBoundingClientRect().bottom <= innerHeight,
    { bottom: document.getElementById('attack').getBoundingClientRect().bottom, height: innerHeight });
  q.start();
  const gesture = new Event('gesturestart', { bubbles: true, cancelable: true });
  document.body.dispatchEvent(gesture);
  check('gameplay rejects native pinch gestures', gesture.defaultPrevented);
  check('the whole game surface owns touch gestures', getComputedStyle(document.getElementById('game-screen')).touchAction === 'none');
  for (const kind of ['upgrade', 'dead', 'won']) {
    q.start(); q.result(kind);
    document.querySelector('#modal button').click();
    check(`${kind} ignores an immediate accidental click`, q.state.modal === kind, q.state);
  }
  q.menu();
  const menuGesture = new Event('gesturestart', { bubbles: true, cancelable: true });
  document.body.dispatchEvent(menuGesture);
  check('lobby keeps normal browser zoom', !menuGesture.defaultPrevented);
  return results;
})()
