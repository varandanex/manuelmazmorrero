// Synthetic pointer events exercise the real handlers, not native OS gestures.
// Pointer capture requires a trusted device, so only that browser primitive is stubbed.
(async () => {
  const q = window.__uiQa, results = [];
  const check = (name, pass) => results.push({ name, pass: !!pass });
  const ids = ['joystick', 'attack', 'dash'];
  const elements = ids.map(id => document.getElementById(id));
  const capture = elements.map(element => element.setPointerCapture);
  const send = (element, type, id, offset = 0) => {
    const r = element.getBoundingClientRect();
    element.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch',
      clientX: r.x + r.width / 2 + offset, clientY: r.y + r.height / 2, bubbles: true, cancelable: true }));
  };
  try {
    elements.forEach(element => { element.setPointerCapture = () => {}; });
    q.start();
    send(elements[0], 'pointerdown', 201, 20); send(elements[1], 'pointerdown', 202);
    check('joystick and attack work together', q.state.touch.x > 0 && q.state.touch.attack);
    const touch = new Event('touchmove', { bubbles: true, cancelable: true });
    Object.defineProperty(touch, 'touches', { value: [{}, {}] }); document.body.dispatchEvent(touch);
    check('multitouch fallback cancels viewport manipulation', touch.defaultPrevented);
    check('multitouch fallback does not clear combat input', q.state.touch.x > 0 && q.state.touch.attack);
    send(elements[1], 'pointerup', 202);
    check('releasing attack keeps the joystick active', q.state.touch.x > 0 && !q.state.touch.attack);
    send(elements[2], 'pointerdown', 203);
    check('joystick and dash work together', q.state.touch.x > 0 && q.state.touch.dash);
    q.result('dead');
    check('result clears movement and combat actions', q.state.touch.x === 0 && !q.state.touch.attack && !q.state.touch.dash);
    send(elements[0], 'pointerup', 201); send(elements[2], 'pointercancel', 203);
  } finally {
    elements.forEach((element, i) => { element.setPointerCapture = capture[i]; }); q.menu();
  }
  return results;
})()
