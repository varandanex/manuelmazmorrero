// Append to main.js only in a local browser test response. Never ship this hook.
window.__uiQa = {
  get state() { return { mode: game?.mode, floor: game?.floor, modal: modalKind, dialogueIndex: bossDialogueIndex, elapsed: game?.elapsed, hp: game?.player.hp, phase: game?.phase, enemies: game?.enemies.map(e => e.type), touch: { ...touch }, keys: [...keys] }; },
  start() { start(); game.player.invulnerable = 999; },
  result(kind) {
    game.mode = kind; game.events.push({ type: kind }); consumeEvents(); updateHud();
  },
  boss() {
    start(); game.phase = 'warning'; game.phaseTimer = 0; game.enemies = [];
    updateGame(game, 1 / 60); game.events = game.events.filter(event => event.type !== 'boss-intro');
    beginBossFight(game); consumeEvents(); game.player.invulnerable = 999;
    pauseGame(game); updateHud();
  },
  scene(phase, floor = 0, bossMode = 'idle') {
    start({ version: 1, floor, perks: Array(floor).fill('power'), score: 120, elapsed: 10, kills: 2, deaths: 0 });
    if (phase === 'boss') {
      game.phase = 'warning'; game.phaseTimer = 0; updateGame(game, 1 / 60);
      game.events = game.events.filter(event => event.type !== 'boss-intro'); beginBossFight(game);
      game.enemies.find(e => e.boss).mode = bossMode;
    } else if (phase === 'mobs') {
      game.phaseTimer = 0; updateGame(game, 1 / 60);
    } else { game.phase = phase; game.phaseTimer = 2; }
    consumeEvents(); pauseGame(game); updateHud();
  },
  introduction(floor = 0) {
    start({ version: 1, floor, perks: Array(floor).fill('power'), score: 120, elapsed: 10, kills: 2, deaths: 0 });
    game.phase = 'warning'; game.phaseTimer = 0; updateGame(game, 1 / 60); consumeEvents(); updateHud();
  },
  dialogueLine(index) { bossDialogueIndex = index; updateBossDialogue(); },
  resume() { resumeGame(game); game.player.invulnerable = 999; },
  danger(kind, overrides = {}) {
    game[kind].push({ type: 'pool', x: 240, y: 120, r: 12, life: 2, delay: 1, vx: 0, vy: 0, damage: 5, ...overrides });
    updateHud();
  },
  menu: backToMenu,
};
