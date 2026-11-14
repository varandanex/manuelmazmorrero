// Original supplied SFX. Variants do not use the simulation RNG.
export const CUES = {
  attack_swing: {"files": ["attack_swing_01.wav", "attack_swing_02.wav", "attack_swing_03.wav"], "duration": 0.205},
  hit_enemy: {"files": ["hit_enemy_01.wav", "hit_enemy_02.wav", "hit_enemy_03.wav"], "duration": 0.277},
  hit_heavy: {"files": ["hit_heavy.wav"], "duration": 0.387},
  dash: {"files": ["dash.wav"], "duration": 0.265},
  player_hurt: {"files": ["player_hurt.wav"], "duration": 0.387},
  enemy_death: {"files": ["enemy_death.wav"], "duration": 0.375},
  projectile_cast: {"files": ["projectile_cast.wav"], "duration": 0.255},
  poison_warning: {"files": ["poison_warning.wav"], "duration": 0.725},
  poison_activate: {"files": ["poison_activate.wav"], "duration": 0.725},
  beam_warning: {"files": ["beam_warning.wav"], "duration": 1.125},
  beam_fire: {"files": ["beam_fire.wav"], "duration": 0.425},
  shield_block: {"files": ["shield_block.wav"], "duration": 0.295},
  generator_destroy: {"files": ["generator_destroy.wav"], "duration": 0.705},
  shield_break: {"files": ["shield_break.wav"], "duration": 0.695},
  boss_intro: {"files": ["boss_intro.wav"], "duration": 0.975},
  butcher_windup: {"files": ["butcher_windup.wav"], "duration": 1.075},
  butcher_charge: {"files": ["butcher_charge.wav"], "duration": 0.475},
  boss_recover: {"files": ["boss_recover.wav"], "duration": 0.487},
  host_phase_two: {"files": ["host_phase_two.wav"], "duration": 0.955},
  heal: {"files": ["heal.wav"], "duration": 0.345},
  ui_confirm: {"files": ["ui_confirm.wav"], "duration": 0.105},
  upgrade_select: {"files": ["upgrade_select.wav"], "duration": 0.425},
  floor_start: {"files": ["floor_start.wav"], "duration": 0.587},
  player_death: {"files": ["player_death.wav"], "duration": 1.015},
  retry: {"files": ["retry.wav"], "duration": 0.325},
  boss_defeat: {"files": ["boss_defeat.wav"], "duration": 1.005},
  victory: {"files": ["victory.wav"], "duration": 1.175},
};

// Small attenuation-only trims from read-only RMS measurements; no pitch/file edits.
// These are level matching, not a substitute for listening on a physical phone.
export const MUSIC = {
  lobby: { file: 'Welcome to the Dungeon.mp3', trim: .822, loop: true },
  floor0: { file: 'Dungeon Showdown.mp3', trim: .785, loop: true },
  floor1: { file: '毒花迷宫.mp3', trim: .851, loop: true },
  floor2: { file: 'Dungeon Game-Show Finale.mp3', trim: .871, loop: true },
  upgrade: { file: 'Dungeon Upgrade.mp3', trim: .724, loop: true },
  won: { file: 'Victory Fanfare.mp3', trim: 1, loop: false },
};

export const IMPACTS = new Set(['hit_enemy', 'hit_heavy', 'enemy_death', 'shield_block', 'generator_destroy']);
export const DANGERS = new Set(['player_hurt', 'poison_warning', 'poison_activate', 'beam_warning', 'beam_fire', 'butcher_windup', 'butcher_charge']);
export const TERMINALS = new Set(['player_death', 'boss_defeat', 'victory']);
