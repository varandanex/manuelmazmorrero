// Append to main.js only in a local browser test response. Never ship this hook.
window.__uiQa = {
  get state() { return { mode: game?.mode, floor: game?.floor, modal: modalKind, touch: { ...touch }, keys: [...keys] }; },
  start() { start(); game.player.invulnerable = 999; },
  result(kind) {
    game.mode = kind; game.events.push({ type: kind }); consumeEvents(); updateHud();
  },
  boss() {
    start(); game.phase = 'warning'; game.phaseTimer = 0; game.enemies = [];
    updateGame(game, 1 / 60); consumeEvents(); game.player.invulnerable = 999;
    floorToastUntil = 0; announcementUntil = 0; pauseGame(game); updateHud();
  },
  menu: backToMenu,
};
