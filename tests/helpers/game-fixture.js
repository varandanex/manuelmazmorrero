import { createGame, beginFloorCombat } from '../../src/game.js';

// Combat tests explicitly acknowledge the floor briefing before simulating time.
export function createPlayingGame(...args) {
  const game = createGame(...args);
  beginFloorCombat(game);
  return game;
}
