// Evaluate with ui-fixture.js appended only to the local main module response.
// This checks UI progression with controlled encounters, not combat difficulty.
(async () => {
  const q = window.__uiQa, results = [];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = (name, pass) => results.push({ name, pass: !!pass });
  const checkpoint = () => JSON.parse(localStorage.getItem('manu-dungeon-checkpoint-v1'));
  const types = ['butcher', 'spore', 'mantaur', 'elemental', 'host'];
  q.start();
  for (let floor = 0; floor < 5; floor++) {
    check(`${floor + 1}: checkpoint is current and includes earned upgrades`, checkpoint().version === 2 && checkpoint().floor === floor && checkpoint().perks.length === floor);
    check(`${floor + 1}: HUD has the five-floor denominator`, document.getElementById('floor-label').textContent === `0${floor + 1} / 05`);
    q.completeFloor();
    check(`${floor + 1}: reading pauses the music`, q.state.audio.paused);
    await wait(1120); document.getElementById('duel-next').click();
    await wait(300); document.getElementById('duel-next').click();
    await wait(300); document.getElementById('duel-next').click();
    check(`${floor + 1}: dialogue leads to the reveal`, q.state.mode === 'boss-reveal');
    await wait(1120); document.getElementById('encounter-next').click();
    check(`${floor + 1}: dialogue starts the right boss`, q.state.enemies.includes(types[floor]) && q.state.mode === 'playing');
    check(`${floor + 1}: battle resumes the right music scene`, q.state.audio.scene === `floor${floor}` && !q.state.audio.paused);
    q.defeatBoss();
    if (floor < 4) {
      check(`${floor + 1}: victory offers an upgrade instead of ending the run`, q.state.modal === 'upgrade');
      await wait(1120); document.querySelector('.upgrade-option').click();
      check(`${floor + 1}: upgrade introduces the next floor`, q.state.floor === floor + 1 && q.state.mode === 'floor-intro');
      q.skipBriefing();
    } else {
      check('only the fifth boss completes the game', q.state.modal === 'won');
      check('victory clears the checkpoint', checkpoint() === null);
      check('victory copy names five floors and five bosses', document.getElementById('modal-copy').textContent.includes('Cinco pisos. Cinco jefes.'));
    }
  }
  q.menu();
  return results;
})()
