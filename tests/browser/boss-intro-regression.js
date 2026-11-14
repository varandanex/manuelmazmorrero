// Run with the local-only ui-fixture.js response hook, never in production.
(async () => {
  const q = window.__uiQa, $ = id => document.getElementById(id), results = [];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = (name, pass) => results.push({ name, pass: !!pass });
  const click = () => $('duel-next').click();
  const key = (type, repeat = false) => document.dispatchEvent(new KeyboardEvent(type, { code: 'Space', key: ' ', repeat, bubbles: true, cancelable: true }));
  const pointer = (type, id) => window.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', bubbles: true, cancelable: true }));
  for (let floor = 0; floor < 5; floor++) {
    q.introduction(floor);
    const before = q.state;
    check(`${floor}: the game pauses before creating the boss`, before.mode === 'boss-intro' && before.enemies.length === 0);
    check(`${floor}: both full-body figures are present`, document.querySelectorAll('.duel-fighter img').length === 2);
    check(`${floor}: Manolo holds the new umbrella`, document.querySelector('[data-speaker="manolo"] img').src.endsWith('/hero-manu-umbrella.webp'));
    check(`${floor}: the boss speaks first`, document.querySelector('.duel-fighter.is-speaking').dataset.speaker === 'boss');
    click();
    check(`${floor}: leftover clicks cannot dismiss the opening line`, q.state.dialogueIndex === 0);
    $('modal').dispatchEvent(new Event('cancel', { cancelable: true }));
    check(`${floor}: Escape cannot bypass the introduction`, $('modal').open && q.state.dialogueIndex === 0);
    await wait(1100);
    check(`${floor}: reading does not advance the clock or reduce health`, q.state.elapsed === before.elapsed && q.state.hp === before.hp);
    $('duel-line').click();
    check(`${floor}: tapping the speech advances one line`, q.state.dialogueIndex === 1);
    check(`${floor}: Manolo lights up when speaking`, document.querySelector('.duel-fighter.is-speaking').dataset.speaker === 'manolo');
    click();
    check(`${floor}: a double tap cannot skip the reply`, q.state.dialogueIndex === 1);
    await wait(300); click();
    check(`${floor}: the final line is shown before combat`, q.state.dialogueIndex === 2 && q.state.mode === 'boss-intro');
    check(`${floor}: the final action is explicit`, $('duel-next').textContent === 'Ver presentación');
    await wait(300); $('duel-line').click();
    check(`${floor}: tapping the final speech never starts combat`, q.state.mode === 'boss-intro');
    click();
    check(`${floor}: the conversation leads to the boss reveal`, q.state.mode === 'boss-reveal' && q.state.enemies.length === 0);
    await wait(1100); $('encounter-next').click();
    check(`${floor}: the explicit final button starts the boss`, q.state.mode === 'playing' && q.state.phase === 'boss' && q.state.modal === '');
    check(`${floor}: the correct boss is spawned`, q.state.enemies.includes(['butcher', 'spore', 'mantaur', 'elemental', 'host'][floor]));
    check(`${floor}: old attack input is cleared`, q.state.keys.length === 0 && !q.state.touch.attack && !q.state.touch.dash);
  }
  q.start(); key('keydown'); q.introduction(); await wait(1150); click();
  check('held attack cannot skip the first line even after the timer', q.state.dialogueIndex === 0);
  key('keyup'); click();
  check('releasing attack still requires a quiet gap', q.state.dialogueIndex === 0);
  await wait(250); click();
  check('a new deliberate click can show the reply', q.state.dialogueIndex === 1);
  await wait(300); key('keydown', true);
  check('native key repeats never advance dialogue', q.state.dialogueIndex === 1);
  key('keyup');
  q.start(); pointer('pointerdown', 101); pointer('pointerdown', 102); q.introduction();
  await wait(1150); pointer('pointerup', 102); await wait(250); click();
  check('both joystick and attack fingers must be released', q.state.dialogueIndex === 0);
  pointer('pointercancel', 101); await wait(250); click();
  check('pointer cancellation safely releases the final finger', q.state.dialogueIndex === 1);
  const beforeBlur = q.state;
  window.dispatchEvent(new Event('blur'));
  check('losing focus preserves the current dialogue instead of opening pause', q.state.modal === 'boss-intro' && q.state.dialogueIndex === beforeBlur.dialogueIndex && q.state.elapsed === beforeBlur.elapsed);
  window.dispatchEvent(new Event('focus'));
  q.menu();
  return results;
})()
