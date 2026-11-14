// Append to main.js only in a local browser test response. Never ship this hook.
function qaSkipBriefing() {
  if (beginFloorCombat(game)) {
    closeModal(); audio.setPaused(false); consumeEvents(); updateHud();
  }
}
function qaSpawnBoss() {
  beginBossReveal(game); beginBossFight(game);
  game.events = game.events.filter(event => !['boss-intro', 'boss-reveal'].includes(event.type));
}
window.__uiQa = {
  get state() { return { mode: game?.mode, floor: game?.floor, modal: modalKind, dialogueIndex: bossDialogueIndex, encounterIndex, elapsed: game?.elapsed, hp: game?.player.hp, phase: game?.phase, enemies: game?.enemies.map(e => e.type), touch: { ...touch }, keys: [...keys], audio: audio.status() }; },
  start() { start(); qaSkipBriefing(); game.player.invulnerable = 999; },
  floor(floor = 0) { start({ version: 2, floor, perks: Array(floor).fill('power'), score: 120, elapsed: 10, kills: 2, deaths: 0 }); },
  card(floor, index) { this.floor(floor); encounterIndex = index; showEncounterCard(); },
  reveal(floor) { this.introduction(floor); beginBossReveal(game); consumeEvents(); updateHud(); },
  skipBriefing: qaSkipBriefing,
  result(kind) {
    game.mode = kind; game.events.push({ type: kind }); consumeEvents(); updateHud();
  },
  boss() {
    this.start(); game.phase = 'warning'; game.phaseTimer = 0; game.enemies = [];
    updateGame(game, 1 / 60); qaSpawnBoss(); consumeEvents(); game.player.invulnerable = 999;
    pauseGame(game); updateHud();
  },
  scene(phase, floor = 0, bossMode = 'idle') {
    this.floor(floor); qaSkipBriefing();
    if (phase === 'boss') {
      game.phase = 'warning'; game.phaseTimer = 0; updateGame(game, 1 / 60); qaSpawnBoss();
      game.enemies.find(e => e.boss).mode = bossMode;
    } else if (phase === 'mobs') {
      game.phaseTimer = 0; updateGame(game, 1 / 60);
    } else { game.phase = phase; game.phaseTimer = 2; }
    consumeEvents(); pauseGame(game); updateHud();
  },
  introduction(floor = 0) {
    this.floor(floor); qaSkipBriefing();
    game.phase = 'warning'; game.phaseTimer = 0; updateGame(game, 1 / 60); consumeEvents(); updateHud();
  },
  dialogueLine(index) { bossDialogueIndex = index; updateBossDialogue(); },
  warningAttack(floor) {
    this.scene('boss', floor);
    resumeGame(game); game.enemies.find(e => e.boss).timer = 0;
    updateGame(game, 1 / 60); consumeEvents(); pauseGame(game); updateHud();
  },
  completeFloor() {
    game.enemies = []; game.phase = 'warning'; game.phaseTimer = 0;
    updateGame(game, 1 / 60); consumeEvents(); updateHud();
  },
  defeatBoss() {
    const boss = game.enemies.find(e => e.boss);
    game.enemies = [boss]; boss.hp = 1; boss.mode = 'recover'; boss.timer = 100;
    boss.x = 240; boss.y = 300; game.player.x = 240; game.player.y = 336;
    game.player.attackCooldown = 0;
    updateGame(game, 1 / 60, { attack: true }); consumeEvents(); updateHud();
  },
  resume() { resumeGame(game); game.player.invulnerable = 999; },
  danger(kind, overrides = {}) {
    game[kind].push({ type: 'pool', x: 240, y: 120, r: 12, life: 2, delay: 1, vx: 0, vy: 0, damage: 5, ...overrides });
    updateHud();
  },
  menu: backToMenu,
};
