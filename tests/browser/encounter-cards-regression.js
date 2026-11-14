// Local-only ui-fixture.js response hook. Real DOM handlers; no production hooks.
(async () => {
  const q = window.__uiQa, results = [], $ = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = (name, pass) => results.push({ name, pass: !!pass });
  const unlock = async () => { for (let i = 0; i < 120 && $('modal-actions').inert; i++) await wait(25); };
  const names = [['Goblin', 'Rata', 'Desperdigador'], ['Vigilante de pared', 'Llama maligna', 'Mono talador'], ['Drek', 'Jikininki', 'Abrojo psicópata'], ['Empalador ácido rastrero', 'Ingeniero goblin', 'Motor de carbón'], ['Comadreja nocturna exploradora', 'Campana funeraria', 'Hobgoblin']];
  for (let floor = 0; floor < 5; floor++) {
    q.floor(floor); const before = q.state;
    check(`${floor}: floor opens with original narrative`, $('modal').dataset.presentation === 'story' && document.querySelector('.encounter-story').textContent.length > 150);
    check(`${floor}: no enemies or music during the narrative`, before.mode === 'floor-intro' && before.enemies.length === 0 && before.audio.paused);
    $('encounter-next').click(); check(`${floor}: an accidental click cannot skip the story`, q.state.encounterIndex === -1);
    $('modal').dispatchEvent(new Event('cancel', { cancelable: true }));
    check(`${floor}: Escape does not start combat`, q.state.mode === 'floor-intro' && $('modal').open);
    await unlock(); check(`${floor}: reading freezes time and HP`, q.state.elapsed === before.elapsed && q.state.hp === before.hp);
    $('encounter-next').click();
    for (const [index, name] of names[floor].entries()) {
      check(`${floor}/${index}: correct enemy order and Spanish name`, $('modal-title').textContent === name && q.state.encounterIndex === index);
      check(`${floor}/${index}: attack and survival advice are present`, !!document.querySelector('.encounter-attack h3').textContent && !!document.querySelector('.encounter-tip').textContent);
      check(`${floor}/${index}: art is a shipped full-body sprite`, document.querySelector('.encounter-figure').src.includes('/assets/webp/enemies/'));
      $('encounter-next').click(); check(`${floor}/${index}: double tap cannot skip the card`, q.state.encounterIndex === index && q.state.mode === 'floor-intro');
      await unlock();
      if (index === names[floor].length - 1) {
        document.querySelector('.encounter-art').click(); check(`${floor}: the last illustration cannot start combat`, q.state.mode === 'floor-intro');
      }
      $('encounter-next').click();
    }
    check(`${floor}: only the explicit final action enters the floor`, q.state.mode === 'playing' && q.state.modal === '' && !q.state.audio.paused);
    check(`${floor}: controls are cleared when entering combat`, !q.state.keys.length && !q.state.touch.attack && !q.state.touch.dash);
    q.completeFloor();
    for (let line = 0; line < 3; line++) { await unlock(); $('duel-next').click(); }
    check(`${floor}: dialogue is followed by a separate epic boss card`, q.state.mode === 'boss-reveal' && $('modal').dataset.presentation === 'boss');
    check(`${floor}: boss reveal has no live boss yet`, q.state.enemies.length === 0 && q.state.audio.paused);
    const reveal = q.state; await wait(1100);
    check(`${floor}: reveal freezes time and health`, q.state.elapsed === reveal.elapsed && q.state.hp === reveal.hp);
    document.querySelector('.encounter-art').click(); check(`${floor}: tapping boss artwork does not launch battle`, q.state.mode === 'boss-reveal');
    $('encounter-next').click(); check(`${floor}: fight starts exactly once on acknowledgement`, q.state.mode === 'playing' && q.state.enemies.length >= 1);
  }
  // Held keyboard input survives the UI reset and must be released before advancing.
  const key = (type, repeat = false) => document.dispatchEvent(new KeyboardEvent(type, { code: 'Space', key: ' ', bubbles: true, cancelable: true, repeat }));
  q.start(); key('keydown'); q.floor(); await wait(1150); $('encounter-next').click();
  check('held attack cannot skip a floor story', q.state.encounterIndex === -1);
  key('keyup'); $('encounter-next').click(); check('a release still needs a quiet interval', q.state.encounterIndex === -1);
  await unlock(); $('encounter-next').click(); check('a fresh action advances after release', q.state.encounterIndex === 0);
  await unlock(); key('keydown', true); check('key repeat cannot skip the enemy card', q.state.encounterIndex === 0); key('keyup');
  window.dispatchEvent(new Event('blur')); const blurred = q.state;
  await wait(300); check('backgrounding keeps the briefing and its clock frozen', q.state.mode === 'floor-intro' && q.state.elapsed === blurred.elapsed && q.state.encounterIndex === blurred.encounterIndex);
  window.dispatchEvent(new Event('focus'));
  q.menu(); return results;
})()
